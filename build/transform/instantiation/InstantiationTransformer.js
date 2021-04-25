"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Program_1 = __importDefault(require("./scope/Program"));
class InstantiationTransformer {
    // private programAST: ASTNode;
    static transform(programNode) {
        return Program_1.default.transform(programNode);
    }
}
exports.default = InstantiationTransformer;
// export default class InstantiationTransformer {
//     private program: ASTNode;
//     private templates: Template[];
//     private constructor(program: ASTNode, templates: Template[]) {
//         this.program = program;
//         this.templates = templates;
//     }
//     public static transform(program: ASTNode): ASTNode {
//         const templates = getTemplates(program);
//         const instantiationTransformer = new InstantiationTransformer(program, templates);
//         const instTransformedProgram = instantiationTransformer.transformPackageTemplateDecls();
//         return ClassDeclarationMerger.transform(instTransformedProgram);
//     }
//     private transformPackageTemplateDecls = (): ASTNode => {
//         return transform(this.program, {
//             template_declaration: this.transformPackageTemplate, // TODO: Vurder om det er nødvendig å gjøre det for templater
//             package_declaration: this.transformPackageTemplate,
//             default: idTransform,
//         }) as ASTNode;
//     };
//     private transformPackageTemplate = (node: ASTNode | null, children: ASTNode[]): ASTNode => {
//         const childrenWithInstTransformed = transform(children, {
//             inst_statement: this.transformInstStatement,
//             default: idTransform,
//         }) as ASTNode[];
//         return { ...(node ?? {}), children: childrenWithInstTransformed } as ASTNode;
//     };
//     private getClosedTemplateBody = (template: Template): ASTNode[] => {
//         if (template.isClosed) return template.body;
//         return this.closeTemplate(template).body;
//     };
//     private closeTemplate = (template: Template): Template => {
//         const closedTemplate = this.transformPackageTemplate(null, template.body);
//         template.body = closedTemplate.children;
//         template.isClosed = true;
//         return template;
//     };
//     private getIdentifier = (children: ASTNode[], errorMsg?: string): string => {
//         const idNode = children.find(typeIs('identifier'));
//         if (idNode === undefined) {
//             throw new Error(errorMsg || 'No identifier node in children');
//         }
//         return idNode.text;
//     };
//     private getTemplate = (id: string): Template | undefined => this.templates.find(identifierIs(id));
// }
