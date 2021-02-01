import {ASTNode} from "../../AST";
import transform, {NodeTransform, Transformer} from "../index";
import {identifierIs, idTransform, typeIs} from "../../util";
import getTemplates, {Template} from "../../util/getTemplates";
import rename from "./rename";
import mergeClasses from "../mergeClasses";

export default class InstantiationTransformer {
    private program: ASTNode;
    private templates : Template[];

    private constructor(program: ASTNode, templates: Template[]) {
        this.program = program;
        this.templates = templates;
    }

    public static transform(program: ASTNode) : ASTNode {
        const templates = getTemplates(program);
        const instantiationTransformer = new InstantiationTransformer(program, templates)
        return instantiationTransformer.transformPackageTemplateDecls();
    }

    private transformPackageTemplateDecls = () : ASTNode => {
        return transform(this.program, {
            template_declaration: this.transformPackageTemplate, // TODO: Vurder om det er nødvendig å gjøre det for templater
            package_declaration: this.transformPackageTemplate,
            default: idTransform,
        }) as ASTNode;
    }

    private transformPackageTemplate = (node: ASTNode | null, children: ASTNode[]) : ASTNode => {
        const newChildren =
            transform(children, {
                inst_statement: this.transformInstStatement,
                default: idTransform,
            });
        return {...node, children: newChildren} as ASTNode;
    }


    private transformInstStatement = (_: ASTNode, children: ASTNode[]) : ASTNode | ASTNode[] => {
        const instId = this.getIdentifier(children, 'Instantiation is instantiating something without an identifier.')
        const renamings =
            children
                .find(typeIs("class_renamings"))
                ?.children.filter(typeIs('class_rename'))
                .map(extractRenamings) || [];

        const template = this.getTemplate(instId);
        if (template === undefined) {
            throw new Error("Instantiating undefined template: " + instId);
        }

        const body = this.getClosedTemplateBody(template);
        const renamedBody = rename(renamings, body);
        const mergedClassesBody = mergeClasses(renamedBody);
        return mergedClassesBody;
    }

    private getClosedTemplateBody = (template: Template) : ASTNode[] => {
        if(template.isClosed) return template.body;
        return this.closeTemplate(template).body;
    }

    private closeTemplate = (template: Template) : Template => {
        const closedTemplate = this.transformPackageTemplate(null, template.body);
        template.body = closedTemplate.children;
        template.isClosed = true;
        return template;
    }

    private getIdentifier = (children: ASTNode[], errorMsg?: string) : string => {
        const idNode = children.find(typeIs('identifier'))

        if(idNode === undefined) {
            throw new Error(errorMsg || 'No identifier node in children');
        }

        return idNode.text
    }

    private getTemplate = (id: string) : Template | undefined =>
        this.templates.find(identifierIs(id));
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