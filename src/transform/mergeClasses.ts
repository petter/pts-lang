import { ASTNode } from '../AST';
import transform, { EMPTY_NODE } from './index';
import { filterMap, idTransform, joinArrays, typeIs } from '../util';
import _ from 'lodash';
import { ScopedRefNode } from './instantiation/scope/ReferenceTransformer';

const classDeclId = (classDecl: ASTNode) => classDecl.children.find(typeIs('type_identifier'))!.text;

export default class ClassDeclarationMerger {
    private program: ASTNode;

    private constructor(program: ASTNode) {
        this.program = program;
    }

    private applyToNodesOfType = (typeFuncMap: { [key: string]: (node: ASTNode) => ASTNode }) => {
        function applyToNodesOfTypeRecurse(node: ASTNode): ASTNode {
            let newNode = node;
            if (node.type in typeFuncMap) {
                newNode = typeFuncMap[node.type](node);
            }

            const newChildren = newNode.children.map(applyToNodesOfTypeRecurse);
            return { ...newNode, children: newChildren };
        }

        this.program = applyToNodesOfTypeRecurse(this.program);
    };

    public static transform(program: ASTNode): ASTNode {
        const classDeclarationMerger = new ClassDeclarationMerger(program);
        return classDeclarationMerger.mergeClasses();
    }

    private mergeClasses = (): ASTNode => {
        this.applyToNodesOfType({
            package_template_body: this.mergeClassesInPTBody,
        });
        return this.program;
    };

    private mergeClassesInPTBody = (node: ASTNode): ASTNode => {
        const groupedClassDecls = this.groupClassDeclarations(node.children);
        const hasMergedClass: { [classId: string]: boolean } = {};

        const classesMergedBody = filterMap(node.children, (child) => {
            if (child.type === 'class_declaration') {
                const classId = classDeclId(child);
                if (hasMergedClass[classId]) {
                    return null;
                } else {
                    hasMergedClass[classId] = true;
                    return this.produceClassDeclaration(groupedClassDecls[classId]);
                }
            } else {
                return child;
            }
        });
        return { ...node, children: classesMergedBody };
    };

    private produceClassDeclaration = (classDecls: ASTNode[]): ASTNode => {
        const classBody = this.produceClassDeclarationBody(classDecls);
        return this.produceClassDeclarationSignature(classDecls, classBody);
    };

    private produceClassDeclarationBody = (classDecls: ASTNode[]): ASTNode[] => {
        const classBodiesWithBrackets = classDecls.map(
            (decl) => decl.children.find(typeIs('class_body'))?.children || [],
        );
        const classBodiesWithoutBrackets = classBodiesWithBrackets.map((el) => el.slice(1, -1));

        const openingBracket = classBodiesWithBrackets[0][0];
        const closingBracket = classBodiesWithBrackets[0][classBodiesWithBrackets[0].length - 1];

        return [openingBracket, ...classBodiesWithoutBrackets.reduce(joinArrays), closingBracket];
    };

    private produceClassDeclarationSignature = (classDecls: ASTNode[], classBody: ASTNode[]): ASTNode => {
        // TODO: Merge heritage
        const resNode = { ...classDecls[0] };
        return {
            ...resNode,
            children: resNode.children.map((el) => (el.type === 'class_body' ? { ...el, children: classBody } : el)),
        };
    };

    private groupClassDeclarations = (nodes: ASTNode[]): _.Dictionary<ASTNode[]> => {
        const classDeclarations = nodes.filter(typeIs('class_declaration'));
        return _.groupBy(classDeclarations, classDeclId);
    };
}

// export default function mergeClasses(program: ASTNode) : ASTNode {
//     return transform(program, {
//         package_template_body: (node, children) => {
//             const classes = children.filter(typeIs('class_declaration'));
//
//             // TODO: Check if two classes can be merged (have different heritage?)
//
//             const classGroups = _.groupBy<ASTNode>(classes, classDeclId);
//             const mergedClasses = mergeClassGroups(classGroups);
//             return replaceClassDeclsWithMergedClasses(children, mergedClasses);
//
//         },
//         default: idTransform
//     })
// }
//
// function mergeClassGroups(classGroups: _.Dictionary<ASTNode[]>) {
//     return Object.values(classGroups).map(mergeClassesInGroups);
// }
//
// function mergeClassesInGroups(classGroup: ASTNode[]) {
//     console.log(classGroup)
//     const bodies = classGroup.map((n) =>
//         n.children.filter(typeIs('class_body')).flatMap((el) => el.children),
//     );
//     const mergedBodies = [
//         bodies[0][0],
//         ...bodies.reduce((prev, cur) => prev.concat(cur.slice(1, -1)), []),
//         bodies[0][bodies[0].length - 1],
//     ];
//
//     const resultClass = classGroup[0];
//     resultClass.children.find(typeIs('class_body'))!.children = mergedBodies;
//     return resultClass;
// }
//
// function replaceClassDeclsWithMergedClasses(body: ASTNode[], mergedClasses: ASTNode[]) {
//     const hasVisited: string[] = [];
//     return transform(body, {
//         class_declaration: (node, children) => {
//             const id = classDeclId(node);
//             if (hasVisited.includes(id)) {
//                 return EMPTY_NODE;
//             }
//             hasVisited.push(id);
//
//             const mergedClass = mergedClasses.find((el) => classDeclId(el) === id);
//             if (mergedClass === undefined) {
//                 return idTransform(node, children);
//             }
//
//             return mergedClass;
//         },
//         default: idTransform,
//     });
// }
