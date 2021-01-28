import {ASTNode} from "../../AST";
import transform, {NodeTransform} from "../index";
import {identifierIs, idTransform, typeIs} from "../../util";
import getTemplates, {Template} from "../../util/getTemplates";
import rename from "./rename";
import mergeClasses from "../mergeClasses";


export default function replaceInstantiations(program: ASTNode, _templates?: Template[]) : ASTNode {
    const templates = _templates || getTemplates(program);
    const replaceInstTransformer = makeReplaceInstTransformer(templates)
    return transformInst(program, replaceInstTransformer);
}

const makeReplaceInstTransformer = (templates: Template[]) : NodeTransform<ASTNode, ASTNode> => (instNode, instChildren) => {
    const ast = { ...instNode, children: instChildren };
    const instReplacedAst = transform<ASTNode, ASTNode>(ast, {
        inst_statement: (node, children) => {
            return instTransformer(node, children, templates)
        },
        default: idTransform,
    }) as ASTNode;

    return mergeClasses(instReplacedAst);
};

const transformInst = (node: ASTNode, replaceInstTransformer: NodeTransform<ASTNode, ASTNode>) => transform(node, {
    template_declaration: replaceInstTransformer, // TODO: Vurder om det er nødvendig å gjøre det for templater
    package_declaration: replaceInstTransformer,
    default: idTransform,
});


const instTransformer = (_ : ASTNode, children : ASTNode[], templates : Template[]) : ASTNode[] => {
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

    let templateBody = template.body;

    if(!template.isClosed) {
        templateBody = replaceInstantiations({children: template.body, type: 'temp', text: ''}, templates).children;
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