import { ASTNode } from "../AST";
import transform from "../transform";

export default function toTS(program: ASTNode) {
  return transform<ASTNode, string>(program, {
    template_declaration: () => "",
    package_declaration: (_, children) => children.slice(2).join(" "),
    package_template_body: (_, children) => children.slice(1, -1).join("\n"),
    statement_block: (_, children) =>
        `${children[0]}\n${children.slice(1, -2).join('\n')}${children[children.length-1]}`,
    class_body: (_, children) => children.join("\n"),
    member_expression: (_, children) => children.join(''),
    program: (_, children) => children.join('\n'),
    default: (node, children) => {
      if (children.length === 0) {
        return node.text;
      } else {
        return children.join(" ");
      }
    },
  }) as string;
}
