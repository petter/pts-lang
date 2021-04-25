import Template from './Template';
import { PACKAGE_DECL } from '../../../token-kinds';
import { ASTNode } from '../../../AST';
import Program from './Program';

export default class Package extends Template {
    public static fromDeclaration(packageDeclaration: ASTNode, program: Program): Package {
        if (packageDeclaration.type !== PACKAGE_DECL) {
            throw new Error('Cannot create a template from a ' + packageDeclaration.type);
        }

        return new Package(packageDeclaration, program);
    }

    public instMe = () => {
        throw new Error("Can't instantiate a pacakge.");
    };

    public toAST = (): ASTNode => {
        const ast = super.toAST();
        ast.type = PACKAGE_DECL;
        console.log(ast.children[0].children);
        return ast;
    };
}
