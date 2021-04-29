import { ASTNode } from '../../../AST';
import {
    CLASS_RENAME,
    CLASS_RENAMINGS,
    FIELD_RENAMINGS,
    INST_STATEMENT,
    RENAME,
    IDENTIFIER,
} from '../../../token-kinds';
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
        if (instStatement.type !== INST_STATEMENT)
            throw new Error(`Can\'t transform ${instStatement.type} to an Inst object.`);

        const instTemplateName = instStatement.children.find(typeIs(IDENTIFIER))?.text;
        if (instTemplateName === undefined)
            throw new Error('Instantiation is instantiating something without an identifier.');

        const renamings =
            instStatement.children
                .find(typeIs(CLASS_RENAMINGS))
                ?.children.filter(typeIs(CLASS_RENAME))
                .map(extractRenamings) || [];

        return new Inst(instTemplateName, renamings, memberOf);
    }
}

function extractRenamings(classRenameNode: ASTNode): InstRenaming {
    const classRenamingNode = classRenameNode.children[0];
    const attributeRenamings =
        classRenameNode.children.find(typeIs(FIELD_RENAMINGS))?.children.filter(typeIs(RENAME)).map(makeRenameObject) ||
        [];

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
