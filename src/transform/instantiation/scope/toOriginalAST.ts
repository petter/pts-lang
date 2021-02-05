import transform from '../../index';
import { ASTNode } from '../../../AST';
import { ScopedRefNode } from './ReferenceTransformer';
import Variable from './Variable';

export default function toOriginalAST(program: ScopedRefNode | ScopedRefNode[]): ASTNode | ASTNode[] {
    if (Array.isArray(program)) {
        return program.map(toOriginalAST) as ASTNode[];
    }

    return transform<ScopedRefNode, ASTNode>(program, {
        variable: (node: any, children) => ({
            type: node.origType,
            text: (node.ref as Variable).toString(),
            children,
        }),
        default: (node: any, children) => ({
            type: node.type,
            text: node.text,
            children,
        }),
    }) as ASTNode;
}
