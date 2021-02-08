"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const util_1 = require("../../util");
const getTemplates_1 = __importDefault(require("../../util/getTemplates"));
const rename_1 = __importDefault(require("./rename"));
const mergeClasses_1 = __importDefault(require("../mergeClasses"));
class InstantiationTransformer {
    constructor(program, templates) {
        this.transformPackageTemplateDecls = () => {
            return index_1.default(this.program, {
                template_declaration: this.transformPackageTemplate,
                package_declaration: this.transformPackageTemplate,
                default: util_1.idTransform,
            });
        };
        this.transformPackageTemplate = (node, children) => {
            const childrenWithInstTransformed = index_1.default(children, {
                inst_statement: this.transformInstStatement,
                default: util_1.idTransform,
            });
            return { ...(node ?? {}), children: childrenWithInstTransformed };
        };
        this.transformInstStatement = (_, children) => {
            const instId = this.getIdentifier(children, 'Instantiation is instantiating something without an identifier.');
            const renamings = children.find(util_1.typeIs('class_renamings'))?.children.filter(util_1.typeIs('class_rename')).map(extractRenamings) ||
                [];
            const template = this.getTemplate(instId);
            if (template === undefined) {
                throw new Error('Instantiating undefined template: ' + instId);
            }
            const body = this.getClosedTemplateBody(template);
            const renamedBody = rename_1.default(renamings, body);
            return renamedBody;
        };
        this.getClosedTemplateBody = (template) => {
            if (template.isClosed)
                return template.body;
            return this.closeTemplate(template).body;
        };
        this.closeTemplate = (template) => {
            const closedTemplate = this.transformPackageTemplate(null, template.body);
            template.body = closedTemplate.children;
            template.isClosed = true;
            return template;
        };
        this.getIdentifier = (children, errorMsg) => {
            const idNode = children.find(util_1.typeIs('identifier'));
            if (idNode === undefined) {
                throw new Error(errorMsg || 'No identifier node in children');
            }
            return idNode.text;
        };
        this.getTemplate = (id) => this.templates.find(util_1.identifierIs(id));
        this.program = program;
        this.templates = templates;
    }
    static transform(program) {
        const templates = getTemplates_1.default(program);
        const instantiationTransformer = new InstantiationTransformer(program, templates);
        const instTransformedProgram = instantiationTransformer.transformPackageTemplateDecls();
        return mergeClasses_1.default.transform(instTransformedProgram);
    }
}
exports.default = InstantiationTransformer;
function extractRenamings(classRenameNode) {
    const classRenaming = classRenameNode.children[0];
    const fieldRenamings = classRenameNode.children
        .find(util_1.typeIs('field_renamings'))
        ?.children.filter(util_1.typeIs('rename'))
        .map(makeRenameObject);
    return {
        ...makeRenameObject(classRenaming),
        fields: fieldRenamings || [],
    };
}
const RENAMING_OLD = 0;
const RENAMING_NEW = 2;
const makeRenameObject = (renamingNode) => ({
    old: renamingNode.children[RENAMING_OLD].text,
    new: renamingNode.children[RENAMING_NEW].text,
});
