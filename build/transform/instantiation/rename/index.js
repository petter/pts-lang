"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const toOriginalAST_1 = __importDefault(require("../scope/toOriginalAST"));
const ASTScoper_1 = __importDefault(require("../scope/ASTScoper"));
function rename(renamings, body) {
    const root = {
        type: 'temp_root',
        children: body.flat(),
        text: '',
    };
    const scopedAST = ASTScoper_1.default.transform(root);
    renamings.forEach((classRenaming) => {
        scopedAST.scope.rename(classRenaming.old, classRenaming.new);
        classRenaming.fields.forEach((fieldRenaming) => scopedAST.scope.renameField(classRenaming.old, fieldRenaming.old, fieldRenaming.new));
    });
    return toOriginalAST_1.default(scopedAST).children;
}
exports.default = rename;
