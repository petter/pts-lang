import { ASTNode } from '../../../AST';
import { ScopedAST } from './ASTScoper';

export default interface ASTTransformable {
    toAST: () => ScopedAST;
}
