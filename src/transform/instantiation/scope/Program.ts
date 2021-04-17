import { ASTNode } from '../../../AST';
import { ScopedAST } from './ASTScoper';
import Scope from './Scope';
import Template from './Template';

type ProgramBody = (ASTNode | Template)[];

const PROGRAM_TYPE = 'program';

export default class Program {
    body: ProgramBody;

    private constructor(ast: ASTNode) {
        this.body = ast.children.map((child) => {
            switch (child.type) {
                case 'package_declaration':
                    return Template.fromDeclaration(child, this);
                case 'template_declaration':
                    return Template.fromDeclaration(child, this);
                default:
                    return child;
            }
        });
    }

    public static transform(ast: ASTNode): Program {
        if (ast.type !== 'program') {
            throw new Error(`Impossible state! Can't transform ${ast.type} to program.`);
        }

        return new Program(ast);
    }

    toAST = (): ASTNode => {
        const children = this.body.map((el) => ('toAST' in el ? el.toAST() : el));
        return {
            type: PROGRAM_TYPE,
            text: '',
            children: children,
        };
    };

    public findTemplate = (templateName: string): Template | undefined =>
        this.body.find((el) => el instanceof Template && el.name === templateName) as Template | undefined;
}
