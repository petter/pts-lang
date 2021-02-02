import prettier from 'prettier';
import { ASTNode } from '../AST';
import transform from '../transform';

export default function toTS(program: ASTNode): string {
    const unformatted = transform<ASTNode, string>(program, {
        template_declaration: () => '',
        package_declaration: (_, children) => children.slice(2).join(''),
        package_template_body: (_, children) => children.slice(1, -1).join('\n'),
        member_expression: (_, children) => children.join(''),
        program: (_, children) => children.join('\n'),
        class_body: (_, children) => children.join('\n'),
        statement_block: (_, children) => children.join('\n'),
        string: (node) => node.text,
        default: (node, children) => {
            if (children.length === 0) {
                return node.text;
            } else {
                return children.join(' ');
            }
        },
    }) as string;
    return prettier.format(unformatted, { semi: true, parser: 'typescript', tabWidth: 4 });
}
