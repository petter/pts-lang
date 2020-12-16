import {ASTNode} from "../AST";
import transform from "./index";
import {idTransform} from "../util";
import _ from 'lodash';

const classDeclId = (cld : ASTNode) => cld.children.find(el => el.type === 'type_identifier')!.text;

export default function mergeClasses(program: ASTNode) : ASTNode {
    return transform<ASTNode, ASTNode>(program, {
        package_template_body: (node, children) => {
            const classes = children.filter(c => c.type === 'class_declaration');

            // TODO: Check if two classes can be merged (have different heritage?)

            const classGroups = _.groupBy<ASTNode>(classes, classDeclId)
            const mergedClasses = Object.values(classGroups).map(clg => {
                const bodies = clg.map(n => n.children.filter(el => el.type === 'class_body').flatMap(el => el.children));
                const mergedBodies = [bodies[0][0], ...bodies.reduce((prev, cur) => prev.concat(cur.slice(1, -1)), []) , bodies[0][bodies[0].length - 1]]

                const resultClass = clg[0]
                resultClass.children.find(el => el.type === 'class_body')!.children = mergedBodies;
                return resultClass;
            });
            return idTransform(node, replaceClassDeclsWithMergedClasses(children, mergedClasses));
        },
        default: idTransform
    }) as ASTNode;
}

function replaceClassDeclsWithMergedClasses(body: ASTNode[], mergedClasses : ASTNode[]) {
    const hasVisited : string[] = [];
    return transform(body, {
        class_declaration: (node, children) => {
            const id = classDeclId(node);
            if(hasVisited.includes(id)) {
                return idTransform(node, children);
            }
            hasVisited.push(id)

            const mergedClass = mergedClasses.find(el => classDeclId(el) === id);
            if(mergedClass === undefined) {
                return idTransform(node, children);
            }

            return mergedClass;
        },
        default: idTransform
    });
}