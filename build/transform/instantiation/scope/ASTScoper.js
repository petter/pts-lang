"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Scope_1 = __importDefault(require("./Scope"));
const transformVariableRefs_1 = __importDefault(require("./transformVariableRefs"));
const nodesWithScope = [
    'class_body',
    'statement_block',
    'enum_body',
    'if_statement',
    'else_statement',
    'for_statement',
    'for_in_statement',
    'while_statement',
    'do_statement',
    'try_statement',
    'with_statement',
];
const shouldNodeHaveOwnScope = (node) => nodesWithScope.includes(node.type);
class ASTScoper {
    constructor(program) {
        this.scopeProgram = () => {
            const rootScope = Scope_1.default.createRootScope();
            return this.scopeNode(this.program, rootScope);
        };
        this.scopeNode = (node, parentScope) => {
            let nodeScope = parentScope;
            if (shouldNodeHaveOwnScope(node)) {
                nodeScope = Scope_1.default.create(parentScope);
            }
            const scopedChildren = node.children.map((child) => this.scopeNode(child, nodeScope));
            return {
                ...node,
                scope: nodeScope,
                children: scopedChildren,
            };
        };
        this.program = program;
    }
    static transform(program) {
        const astScoper = new ASTScoper(program);
        const scopedAst = astScoper.scopeProgram();
        return transformVariableRefs_1.default.transform(scopedAst);
    }
}
exports.default = ASTScoper;
