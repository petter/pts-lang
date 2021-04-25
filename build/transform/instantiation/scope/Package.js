"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Template_1 = __importDefault(require("./Template"));
const token_kinds_1 = require("../../../token-kinds");
class Package extends Template_1.default {
    constructor() {
        super(...arguments);
        this.instMe = () => {
            throw new Error("Can't instantiate a pacakge.");
        };
        this.toAST = () => {
            const ast = super.toAST();
            ast.type = token_kinds_1.PACKAGE_DECL;
            console.log(ast.children[0].children);
            return ast;
        };
    }
    static fromDeclaration(packageDeclaration, program) {
        if (packageDeclaration.type !== token_kinds_1.PACKAGE_DECL) {
            throw new Error('Cannot create a template from a ' + packageDeclaration.type);
        }
        return new Package(packageDeclaration, program);
    }
}
exports.default = Package;
