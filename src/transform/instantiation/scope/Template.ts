import { ASTNode } from '../../../AST';
import { typeIs } from '../../../util';
import ASTScoper, { ScopedAST } from './ASTScoper';
import Class from './Class';
import Inst, { InstRenaming } from './Inst';
import Program from './Program';

type TemplateBodyElement = Class | Inst;
type TemplateBody = TemplateBodyElement[];
type StagedRenamings = { [name: string]: [Class, string] };

export default class Template {
    name: string;
    body!: TemplateBody;
    program: Program;
    // scope: Scope;
    get isClosed() {
        return this.body.every((el) => el instanceof Class);
    }

    private constructor(name: string, program: Program) {
        this.name = name;
        this.program = program;
    }

    public static fromDeclaration(packageTemplateDeclaration: ASTNode, program: Program): Template {
        if (
            packageTemplateDeclaration.type !== 'package_declaration' &&
            packageTemplateDeclaration.type !== 'template_declaration'
        ) {
            throw new Error('Cannot create a template from a ' + packageTemplateDeclaration.type);
        }

        const templateName = packageTemplateDeclaration.children.find(typeIs('identifier'))?.text;
        if (templateName === undefined) throw new Error('Impossible state! Template has no name.');

        const template = new Template(templateName, program);

        const ptBodyNode = packageTemplateDeclaration.children.find(typeIs('package_template_body'));
        if (ptBodyNode === undefined) throw new Error('Impossible state! Template has no body.');
        const scopedPtBodyNode = ASTScoper.transform(ptBodyNode);
        const scopedPtBody = scopedPtBodyNode.children.slice(1, -1);

        const body = scopedPtBody.map((el) => parsePTBodyElement(el, template));
        template.body = body;

        return template;
    }

    public inst = (inst: Inst, instBodyIndex: number) => {
        const template = this.program.findTemplate(inst.templateName);
        if (template === undefined) {
            throw new Error(`Can\'t instantiate template ${inst.templateName}, as it does not exist.`);
        }

        const renamedTemplate = template.performRenamings(inst.renamings);

        const bodyPreInst = this.body.slice(0, instBodyIndex);
        const bodyPostInst = this.body.slice(instBodyIndex + 1);
        this.body = [...bodyPreInst, ...renamedTemplate.body, ...bodyPostInst];
    };

    public performRenamings = (renamings: InstRenaming[]): Template => {
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
            const classIndex = clone.body.findIndex((el) => el instanceof Class && el.className === oldClassName);
            if (classIndex === -1)
                throw new Error("Impossible state! A class that has already been renamed can't be found in template.");

            newClass.className = newName;
            clone.body[classIndex] = newClass;
        });

        return clone;
    };

    public clone = (): Template => {
        return { ...this };
    };

    public findClass = (className: string): Class | undefined =>
        this.body.find((el) => el instanceof Class && el.className === className) as Class | undefined;

    getClosedBody: () => Class[] = () => {
        if (!this.body.every((el) => el instanceof Class))
            throw new Error(
                `Body of template ${this.name} is not closed. Method is not completely implemented, should close the body in the future, perhaps`,
            );

        return this.body as Class[];
    };

    toAST: () => ASTNode = () => {
        const closedBody = this.getClosedBody();

        return {
            type: 'template_declaration',
            text: '',
            children: closedBody.map((el) => el.toAST()),
        };
    };
}

function parsePTBodyElement(ptBodyEl: ScopedAST, template: Template): TemplateBodyElement {
    switch (ptBodyEl.type) {
        case 'class_declaration':
            return Class.fromClassDeclaration(ptBodyEl, template);
        case 'inst_statement':
            return Inst.transform(ptBodyEl, template);
        default:
            throw new Error(`${ptBodyEl.type} is not a supported body element`);
    }
}
