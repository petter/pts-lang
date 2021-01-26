import {ASTNode} from "../../AST";
import transform, {NodeTransform} from "../index";
import {identifierIs, idTransform, typeIs} from "../../util";
import getTemplates from "../../util/getTemplates";
import rename from "./rename";
import mergeClasses from "../mergeClasses";


export default function replaceInstantiations(program: ASTNode) : ASTNode {
    const templates = getTemplates(program);
    const replaceInst: NodeTransform<ASTNode, ASTNode> = (instNode, instChildren) => {
        let res: ASTNode = { ...instNode, children: instChildren };
        let inst = false;
        do {
            inst = false;
            res = transform<ASTNode, ASTNode>(res, {
                inst_statement: (node, children) => {
                    inst = true;
                    return instTransformer(node, children, templates)
                },
                default: idTransform,
            }) as ASTNode;
            res = mergeClasses(res);
        } while (inst);

        return res;
    };

    return transform(program, {
        template_declaration: replaceInst,
        package_declaration: replaceInst,
        default: idTransform,
    });
}

const instTransformer = (_ : ASTNode, children : ASTNode[], templates : {identifier: string, body: ASTNode[], closed: boolean}[]) : ASTNode[] => {
    const instId =
        children.find(typeIs('identifier'))?.text || "";
    const renamings =
        children
            .find(typeIs("class_renamings"))
            ?.children.filter(typeIs('class_rename'))
            .map(extractRenamings) || [];

    const template = templates.find(identifierIs(instId));
    if (template === undefined) {
        throw new Error("Instantiating undefined template: " + instId);
    }
    return rename(renamings, template.body);
}

function extractRenamings(classRenameNode: ASTNode) {
    const classRenaming = classRenameNode.children[0];
    const fieldRenamings = classRenameNode.children
        .find(typeIs('field_renamings'))
        ?.children.filter(typeIs('rename'))
        .map(makeRenameObject);

    return {
        ...makeRenameObject(classRenaming),
        fields: fieldRenamings || [],
    };
}

const RENAMING_OLD = 0;
const RENAMING_NEW = 2;
const makeRenameObject = (renamingNode: ASTNode) => ({
    old: renamingNode.children[RENAMING_OLD].text,
    new: renamingNode.children[RENAMING_NEW].text
})