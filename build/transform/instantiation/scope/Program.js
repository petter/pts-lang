"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Template_1 = __importDefault(require("./Template"));
const Package_1 = __importDefault(require("./Package"));
const token_kinds_1 = require("../../../token-kinds");
class Program {
    constructor(ast) {
        this.toAST = () => {
            const children = this.body.map((el) => ('toAST' in el ? el.toAST() : el));
            return {
                type: token_kinds_1.PROGRAM,
                text: '',
                children: children,
            };
        };
        this.findTemplate = (templateName) => this.body.find((el) => el instanceof Template_1.default && el.name === templateName);
        this.body = ast.children.map((child) => {
            switch (child.type) {
                case token_kinds_1.PACKAGE_DECL:
                    return Package_1.default.fromDeclaration(child, this);
                case token_kinds_1.TEMPLATE_DECL:
                    return Template_1.default.fromDeclaration(child, this);
                default:
                    return child;
            }
        });
        this.body.forEach((el) => el instanceof Template_1.default && el.closeBody());
    }
    static transform(ast) {
        if (ast.type !== token_kinds_1.PROGRAM) {
            throw new Error(`Impossible state! Can't transform ${ast.type} to program.`);
        }
        const program = new Program(ast);
        return program.toAST();
    }
}
exports.default = Program;
