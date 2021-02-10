import { ASTNode } from '../AST';
import { filterMap, joinArrays, typeIs } from '../util';
import _ from 'lodash';

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

        this.verifyAddtoValid(groupedClassDecls);

        const hasMergedClass: { [classId: string]: boolean } = {};

        const classesMergedBody = filterMap(node.children, (child) => {
            if (typeIs(['class_declaration', 'addto_statement'])(child)) {
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

    private groupClassDeclarations = (nodes: ASTNode[]): _.Dictionary<ASTNode[]> => {
        const classDeclarations = nodes.filter(typeIs(['class_declaration', 'addto_statement']));
        return _.groupBy(classDeclarations, classDeclId);
    };

    private verifyAddtoValid = (groups: _.Dictionary<ASTNode[]>) => {
        Object.keys(groups).forEach((key) => this.verifyAddtoValidGroup(key, groups[key]));
    };

    private verifyAddtoValidGroup = (className: string, group: ASTNode[]) => {
        if (group.every(typeIs('addto_statement')))
            throw new Error(`Can\'t addto class ${className} as there is no class declaration for ${className}`);
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
        const resNode = { ...classDecls.find(typeIs('class_declaration'))! };
        return {
            ...resNode,
            children: resNode.children.map((el) => (el.type === 'class_body' ? { ...el, children: classBody } : el)),
        };
    };
}
