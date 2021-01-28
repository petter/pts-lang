import {idTransform, typeIs} from ".";
import { ASTNode } from "../AST";
import transform, { Transformer } from "../transform";

export type Template = { identifier: string; body: ASTNode[], isClosed: boolean };
export default function getTemplates(program: ASTNode) {
  function isClosed(body: ASTNode[]) {
    return !body.some(child => child.type === 'inst_statement')
  }

  const templates: Template[] = [];

  const findTemplatesTransform: Transformer<ASTNode, ASTNode> = {
    template_declaration: (node, children) => {
      const identifier =
        findByType(children, 'identifier')?.text || "";
      const body =
        findByType(children, "package_template_body")?.children.slice(1, -1) || [];
      templates.push({ identifier, body, isClosed: isClosed(body) });
      return idTransform(node, children);
    },
    default: idTransform,
  };

  transform(program, findTemplatesTransform);
  return templates;
}

const findByType = (children: ASTNode[], type: string) => children.find(typeIs(type));