import { idTransform } from ".";
import { ASTNode } from "../AST";
import transform, { Transformer } from "../transform";

export default function getTemplates(program: ASTNode) {
  function isClosed(body: ASTNode[]) {
    return !body.some(child => child.type === 'inst_statement')
  }
  const templates: { identifier: string; body: ASTNode[], closed: boolean }[] = [];
  const findTemplatesTransform: Transformer<ASTNode, ASTNode> = {
    template_declaration: (node, children) => {
      const identifier =
        children.find((child) => child.type === "identifier")?.text || "";
      const body =
        children.find((child) => child.type === "package_template_body")
          ?.children.slice(1, -1) || [];
      templates.push({ identifier, body, closed: isClosed(body) });
      return idTransform(node, children);
    },
    default: idTransform,
  };
  transform(program, findTemplatesTransform);
  return templates;
}