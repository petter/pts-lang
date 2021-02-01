import { idTransform, typeIs } from '.';
import { ASTNode } from '../AST';
import transform, { Transformer } from '../transform';

export type Template = { identifier: string; body: ASTNode[]; isClosed: boolean };

export function isClosed(body: ASTNode[]): boolean {
    return !body.some((child) => child.type === 'inst_statement');
}

export default function getTemplates(ast: ASTNode | ASTNode[]): Template[] {
    const templates: Template[] = [];
    const findTemplatesTransform: Transformer<ASTNode, ASTNode> = {
        template_declaration: (node, children) => {
            const identifier = findByType(children, 'identifier')?.text || '';
            const body = findByType(children, 'package_template_body')?.children.slice(1, -1) || [];
            templates.push({ identifier, body, isClosed: isClosed(body) });
            return idTransform(node, children);
        },
        default: idTransform,
    };

    transform(ast, findTemplatesTransform);
    return templates;
}

const findByType = (children: ASTNode[], type: string) => children.find(typeIs(type));
