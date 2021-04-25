import { ASTNode } from '../../../AST';
import { typeIs } from '../../../util';
import ASTScoper, { ScopedAST } from './ASTScoper';
import Class from './Class';
import Inst, { InstRenaming } from './Inst';
import Program from './Program';
import {
    INST_STATEMENT,
    ADDTO_STATEMENT,
    CLASS_DECLARATION,
    TEMPLATE_DECL,
    RIGHT_BRACKET_NODE,
    LEFT_BRACKET_NODE,
    PACKAGE_TEMPLATE_BODY,
    TEMPLATE_NODE,
    IDENTIFIER,
} from '../../../token-kinds';

type TemplateBodyElement = Class | Inst;
type TemplateBody = TemplateBodyElement[];
type StagedRenamings = { [name: string]: [Class, string] };

export default class Template {
    name: string;
    body!: TemplateBody;
    program: Program;
    // scope: Scope;
    get isClosed(): boolean {
        return this.body.every((el) => el instanceof Class);
    }

    protected constructor(templateDeclaration: ASTNode, program: Program) {
        this.program = program;

        const templateName = templateDeclaration.children.find(typeIs('identifier'))?.text;
        if (templateName === undefined) throw new Error('Impossible state! Template has no name.');
        this.name = templateName;

        const ptBodyNode = templateDeclaration.children.find(typeIs('package_template_body'));
        if (ptBodyNode === undefined) throw new Error('Impossible state! Template has no body.');
        const scopedPtBodyNode = ASTScoper.transform(ptBodyNode);
        const scopedPtBody = scopedPtBodyNode.children.slice(1, -1);

        this.body = scopedPtBody.map((el) => parsePTBodyElement(el, this));
    }

    public static fromDeclaration(templateDeclaration: ASTNode, program: Program): Template {
        if (templateDeclaration.type !== TEMPLATE_DECL) {
            throw new Error('Cannot create a template from a ' + templateDeclaration.type);
        }

        return new Template(templateDeclaration, program);
    }

    public closeBody = () => {
        this.body = this.body.flatMap((el) => {
            if (el instanceof Inst) {
                return this.inst(el);
            }

            return el;
        });
    };

    private inst = (inst: Inst): TemplateBody => {
        const template = this.program.findTemplate(inst.templateName);
        if (template === undefined) {
            throw new Error(`Can't instantiate template ${inst.templateName}, as it does not exist.`);
        }

        const renamedTemplate = template.instMe(inst.renamings);

        return renamedTemplate.body;
    };

    public instMe = (renamings: InstRenaming[]): Template => {
        const clone = this.clone();

        const stagedClassRenamings = renamings.reduce<StagedRenamings>((obj, classRenaming) => {
            if (classRenaming.old in obj) {
                throw new Error(
                    `Can't rename a class more than once per instantiation. Trying to rename class ${classRenaming.old} in template ${this.name} more than once.`,
                );
            }

            const cls = clone.findClass(classRenaming.old);
            if (cls === undefined) {
                throw new Error(
                    `Can't rename class ${classRenaming.old} in template ${this.name} as this class does not exist`,
                );
            }

            const classWithAttrRenamed = cls.renameAttributes(classRenaming.attributeRenamings);
            return { ...this, [classRenaming.old]: [classWithAttrRenamed, classRenaming.new] };
        }, {});

        Object.keys(stagedClassRenamings).forEach((oldClassName) => {
            const [newClass, newName] = stagedClassRenamings[oldClassName];
            const classIndex = clone.body.findIndex((el) => el instanceof Class && el.name === oldClassName);
            if (classIndex === -1)
                throw new Error("Impossible state! A class that has already been renamed can't be found in template.");

            newClass.name = newName;
            clone.body[classIndex] = newClass;
        });

        return clone;
    };

    public clone = (): Template => {
        return { ...this };
    };

    public findClass = (className: string): Class | undefined =>
        this.body.find((el) => el instanceof Class && el.name === className) as Class | undefined;

    getClosedBody: () => Class[] = () => {
        if (!this.body.every((el) => el instanceof Class))
            throw new Error(
                `Body of template ${this.name} is not closed. Method is not completely implemented, should close the body in the future, perhaps`,
            );

        return this.body as Class[];
    };

    toAST(): ASTNode {
        const closedBody = this.getClosedBody();
        return {
            type: TEMPLATE_DECL,
            text: '',
            children: [
                TEMPLATE_NODE,
                { type: IDENTIFIER, text: this.name, children: [] },
                {
                    type: PACKAGE_TEMPLATE_BODY,
                    text: '',
                    children: [LEFT_BRACKET_NODE, ...closedBody.map((el) => el.toAST()), RIGHT_BRACKET_NODE],
                },
            ],
        };
    }
}

function parsePTBodyElement(ptBodyEl: ScopedAST, template: Template): TemplateBodyElement {
    switch (ptBodyEl.type) {
        case CLASS_DECLARATION:
            return Class.fromClassDeclaration(ptBodyEl, template);
        case INST_STATEMENT:
            return Inst.transform(ptBodyEl, template);
        case ADDTO_STATEMENT:
            // TODO
            throw new Error('Addto not implemented yet!');
        default:
            throw new Error(`${ptBodyEl.type} is not a supported body element`);
    }
}
