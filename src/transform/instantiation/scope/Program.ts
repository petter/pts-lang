import { ASTNode } from '../../../AST';
import Template from './Template';
import Package from './Package';
import { PACKAGE_DECL, TEMPLATE_DECL, PROGRAM } from '../../../token-kinds';

type ProgramBody = (ASTNode | Template)[];

export default class Program {
    body: ProgramBody;

    private constructor(ast: ASTNode) {
        this.body = ast.children.map((child) => {
            switch (child.type) {
                case PACKAGE_DECL:
                    return Package.fromDeclaration(child, this);
                case TEMPLATE_DECL:
                    return Template.fromDeclaration(child, this);
                default:
                    return child;
            }
        });

        this.body.forEach((el) => 'closeBody' in el && el.closeBody());
    }

    public static transform(ast: ASTNode): ASTNode {
        if (ast.type !== PROGRAM) {
            throw new Error(`Impossible state! Can't transform ${ast.type} to program.`);
        }

        const program = new Program(ast);

        return program.toAST();
    }

    toAST = (): ASTNode => {
        const children = this.body.map((el) => ('toAST' in el ? el.toAST() : el));
        return {
            type: PROGRAM,
            text: '',
            children: children,
        };
    };

    public findTemplate = (templateName: string): Template | undefined =>
        this.body.find((el) => el instanceof Template && el.name === templateName) as Template | undefined;
}
