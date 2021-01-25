"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var toScopedAst_1 = __importDefault(require("../scope/toScopedAst"));
var toOriginalAST_1 = __importDefault(require("../scope/toOriginalAST"));
function rename(renamings, body) {
    var root = {
        type: 'temp_root',
        children: body,
        text: ''
    };
    var scopedAST = toScopedAst_1.default(root);
    renamings.forEach(function (classRenaming) {
        scopedAST.scope.rename(classRenaming.old, classRenaming.new);
        classRenaming.fields.forEach(function (fieldRenaming) {
            return scopedAST.scope.renameField(classRenaming.old, fieldRenaming.old, fieldRenaming.new);
        });
    });
    return toOriginalAST_1.default(scopedAST).children;
}
exports.default = rename;
