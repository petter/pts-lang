import {ASTNode} from "../../AST";
import transform, {Transform} from "../index";
import {idTransform} from "../../util";
import getTemplates from "../../util/getTemplates";
import rename from "./rename";
import mergeClasses from "../mergeClasses";

export default function replaceInstantiations(program: ASTNode) : ASTNode {
    const templates = getTemplates(program);
    const replaceInst: Transform<ASTNode, ASTNode> = (instNode, instChildren) => {
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
        children.find((child) => child.type === "identifier")?.text || "";
    const renamings =
        children
            .find((el) => el.type === "class_renamings")
            ?.children.filter((child) => child.type === "class_rename")
            .map((el) => {
                const classRenaming = el.children[0];
                const fieldRenamings = el.children
                    .find((maybeFields) => maybeFields.type === "field_renamings")
                    ?.children.filter(
                        (maybeRename) => maybeRename.type === "rename"
                    )
                    .map((renaming) => ({
                        old: renaming.children[0].text,
                        new: renaming.children[2].text,
                    }));

                return {
                    old: classRenaming.children[0].text,
                    new: classRenaming.children[2].text,
                    fields: fieldRenamings || [],
                };
            }) || [];

    const template = templates.find((t) => t.identifier === instId);
    if (template === undefined) {
        throw new Error("Instantiating undefined template, " + instId);
    }
    return rename(renamings, template.body);
}