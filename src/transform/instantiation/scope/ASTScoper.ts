import { ASTNode } from '../../../AST';
import Scope from './Scope';
import ReferenceTransformer, { ScopedRefNode } from './ReferenceTransformer';

export interface ScopedAST extends ASTNode {
    scope: Scope;
    children: ScopedAST[];
}

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
const shouldNodeHaveOwnScope = (node: { type: string }) => nodesWithScope.includes(node.type);

export default class ASTScoper {
    private program: ASTNode;

    private constructor(program: ASTNode) {
        this.program = program;
    }

    public static transform(program: ASTNode): ScopedRefNode {
        const astScoper = new ASTScoper(program);
        const scopedAst = astScoper.scopeProgram();
        return ReferenceTransformer.transform(scopedAst);
    }

    private scopeProgram = (): ScopedAST => {
        const rootScope = Scope.createRootScope();
        return this.scopeNode(this.program, rootScope);
    };

    private scopeNode = (node: ASTNode, parentScope: Scope): ScopedAST => {
        let nodeScope = parentScope;
        if (shouldNodeHaveOwnScope(node)) {
            nodeScope = Scope.create(parentScope);
        }
        const scopedChildren = node.children.map((child) => this.scopeNode(child, nodeScope));
        return {
            ...node,
            scope: nodeScope,
            children: scopedChildren,
        };
    };
}
