"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../util");
const ASTScoper_1 = __importDefault(require("./ASTScoper"));
const Class_1 = __importDefault(require("./Class"));
const Inst_1 = __importDefault(require("./Inst"));
const token_kinds_1 = require("../../../token-kinds");
class Template {
    constructor(templateDeclaration, program) {
        this.closeBody = () => {
            this.body = this.body.flatMap((el) => {
                if (el instanceof Inst_1.default) {
                    return this.inst(el);
                }
                return el;
            });
        };
        this.inst = (inst) => {
            const template = this.program.findTemplate(inst.templateName);
            if (template === undefined) {
                throw new Error(`Can't instantiate template ${inst.templateName}, as it does not exist.`);
            }
            const renamedTemplate = template.instMe(inst.renamings);
            return renamedTemplate.body;
        };
        this.instMe = (renamings) => {
            const clone = this.clone();
            const stagedClassRenamings = renamings.reduce((obj, classRenaming) => {
                if (classRenaming.old in obj) {
                    throw new Error(`Can't rename a class more than once per instantiation. Trying to rename class ${classRenaming.old} in template ${this.name} more than once.`);
                }
                const cls = clone.findClass(classRenaming.old);
                if (cls === undefined) {
                    throw new Error(`Can't rename class ${classRenaming.old} in template ${this.name} as this class does not exist`);
                }
                const classWithAttrRenamed = cls.renameAttributes(classRenaming.attributeRenamings);
                return { ...this, [classRenaming.old]: [classWithAttrRenamed, classRenaming.new] };
            }, {});
            Object.keys(stagedClassRenamings).forEach((oldClassName) => {
                const [newClass, newName] = stagedClassRenamings[oldClassName];
                const classIndex = clone.body.findIndex((el) => el instanceof Class_1.default && el.name === oldClassName);
                if (classIndex === -1)
                    throw new Error("Impossible state! A class that has already been renamed can't be found in template.");
                newClass.name = newName;
                clone.body[classIndex] = newClass;
            });
            return clone;
        };
        this.clone = () => {
            return { ...this };
        };
        this.findClass = (className) => this.body.find((el) => el instanceof Class_1.default && el.name === className);
        this.getClosedBody = () => {
            if (!this.body.every((el) => el instanceof Class_1.default))
                throw new Error(`Body of template ${this.name} is not closed. Method is not completely implemented, should close the body in the future, perhaps`);
            return this.body;
        };
        this.program = program;
        const templateName = templateDeclaration.children.find(util_1.typeIs('identifier'))?.text;
        if (templateName === undefined)
            throw new Error('Impossible state! Template has no name.');
        this.name = templateName;
        const ptBodyNode = templateDeclaration.children.find(util_1.typeIs('package_template_body'));
        if (ptBodyNode === undefined)
            throw new Error('Impossible state! Template has no body.');
        const scopedPtBodyNode = ASTScoper_1.default.transform(ptBodyNode);
        const scopedPtBody = scopedPtBodyNode.children.slice(1, -1);
        this.body = scopedPtBody.map((el) => parsePTBodyElement(el, this));
    }
    // scope: Scope;
    get isClosed() {
        return this.body.every((el) => el instanceof Class_1.default);
    }
    static fromDeclaration(templateDeclaration, program) {
        if (templateDeclaration.type !== token_kinds_1.TEMPLATE_DECL) {
            throw new Error('Cannot create a template from a ' + templateDeclaration.type);
        }
        return new Template(templateDeclaration, program);
    }
    toAST() {
        const closedBody = this.getClosedBody();
        return {
            type: token_kinds_1.TEMPLATE_DECL,
            text: '',
            children: [
                token_kinds_1.TEMPLATE_NODE,
                { type: token_kinds_1.IDENTIFIER, text: this.name, children: [] },
                {
                    type: token_kinds_1.PACKAGE_TEMPLATE_BODY,
                    text: '',
                    children: [token_kinds_1.LEFT_BRACKET_NODE, ...closedBody.map((el) => el.toAST()), token_kinds_1.RIGHT_BRACKET_NODE],
                },
            ],
        };
    }
}
exports.default = Template;
function parsePTBodyElement(ptBodyEl, template) {
    switch (ptBodyEl.type) {
        case token_kinds_1.CLASS_DECLARATION:
            return Class_1.default.fromClassDeclaration(ptBodyEl, template);
        case token_kinds_1.INST_STATEMENT:
            return Inst_1.default.transform(ptBodyEl, template);
        case token_kinds_1.ADDTO_STATEMENT:
            // TODO
            throw new Error('Addto not implemented yet!');
        default:
            throw new Error(`${ptBodyEl.type} is not a supported body element`);
    }
}
