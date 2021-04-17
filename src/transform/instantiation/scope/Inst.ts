import { ASTNode } from '../../../AST';
import { typeIs } from '../../../util';
import Template from './Template';

export type Renaming = { old: string; new: string };
export type InstRenaming = Renaming & { attributeRenamings: Renaming[] };

export default class Inst {
    templateName: string;
    renamings: InstRenaming[];
    memberOf: Template;

    private constructor(template: string, renamings: InstRenaming[], memberOf: Template) {
        this.templateName = template;
        this.renamings = renamings;
        this.memberOf = memberOf;
    }

    public static transform(instStatement: ASTNode, memberOf: Template) {
        if (instStatement.type !== 'inst_statement')
            throw new Error(`Can\'t transform ${instStatement.type} to an Inst object.`);

        const instTemplateName = instStatement.children.find(typeIs('identifier'))?.text;
        if (instTemplateName === undefined)
            throw new Error('Instantiation is instantiating something without an identifier.');

        const renamings =
            instStatement.children
                .find(typeIs('class_renamings'))
                ?.children.filter(typeIs('class_rename'))
                .map(extractRenamings) || [];

        return new Inst(instTemplateName, renamings, memberOf);
    }
}

function extractRenamings(classRenameNode: ASTNode): InstRenaming {
    const classRenamingNode = classRenameNode.children[0];
    const attributeRenamings =
        classRenameNode.children
            .find(typeIs('field_renamings'))
            ?.children.filter(typeIs('rename'))
            .map(makeRenameObject) || [];

    return {
        ...makeRenameObject(classRenamingNode),
        attributeRenamings: attributeRenamings,
    };
}

function makeRenameObject(rename: ASTNode): Renaming {
    return {
        old: rename.children[RENAME_OLD_INDEX].text,
        new: rename.children[RENAME_NEW_INDEX].text,
    };
}

const RENAME_OLD_INDEX = 0;
const RENAME_NEW_INDEX = 2;
