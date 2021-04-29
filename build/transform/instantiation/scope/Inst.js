"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_kinds_1 = require("../../../token-kinds");
const util_1 = require("../../../util");
class Inst {
    constructor(template, renamings, memberOf) {
        this.templateName = template;
        this.renamings = renamings;
        this.memberOf = memberOf;
    }
    static transform(instStatement, memberOf) {
        if (instStatement.type !== token_kinds_1.INST_STATEMENT)
            throw new Error(`Can\'t transform ${instStatement.type} to an Inst object.`);
        const instTemplateName = instStatement.children.find(util_1.typeIs(token_kinds_1.IDENTIFIER))?.text;
        if (instTemplateName === undefined)
            throw new Error('Instantiation is instantiating something without an identifier.');
        const renamings = instStatement.children
            .find(util_1.typeIs(token_kinds_1.CLASS_RENAMINGS))
            ?.children.filter(util_1.typeIs(token_kinds_1.CLASS_RENAME))
            .map(extractRenamings) || [];
        return new Inst(instTemplateName, renamings, memberOf);
    }
}
exports.default = Inst;
function extractRenamings(classRenameNode) {
    const classRenamingNode = classRenameNode.children[0];
    const attributeRenamings = classRenameNode.children.find(util_1.typeIs(token_kinds_1.FIELD_RENAMINGS))?.children.filter(util_1.typeIs(token_kinds_1.RENAME)).map(makeRenameObject) ||
        [];
    return {
        ...makeRenameObject(classRenamingNode),
        attributeRenamings: attributeRenamings,
    };
}
function makeRenameObject(rename) {
    return {
        old: rename.children[RENAME_OLD_INDEX].text,
        new: rename.children[RENAME_NEW_INDEX].text,
    };
}
const RENAME_OLD_INDEX = 0;
const RENAME_NEW_INDEX = 2;
