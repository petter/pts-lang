import Parser from "tree-sitter";
import fs from "fs";
import { toAST, ASTNode } from "./AST";
import transform, { Transformer, Transform } from "./transform";

// tslint:disable-next-line: no-var-requires
const PTS = require("tree-sitter-pts");

const parser = new Parser();
parser.setLanguage(PTS);

const content = fs.readFileSync(
  "./examples/inst-template-in-template.pts",
  "utf-8"
);

const parseTree = parser.parse(content);

const ast = toAST(parseTree);

const sExprTransformer: Transformer<ASTNode, string> = {
  default: (node, children) => `${node.type} (${children.join(", ")})`,
};
const sExprs = transform(ast, sExprTransformer);

const idTransform: Transform = (node, children) => ({ ...node, children });

function getTemplates(program: ASTNode) {
  const templates: { identifier: string; body: ASTNode[] }[] = [];
  const findTemplatesTransform: Transformer<ASTNode, ASTNode> = {
    template_declaration: (node, children) => {
      const identifier =
        children.find((child) => child.type === "identifier")?.text || "";
      const body =
        children.find((child) => child.type === "package_template_body")
          ?.children || [];
      templates.push({ identifier, body });
      return idTransform(node, children);
    },
    default: idTransform,
  };
  transform(ast, findTemplatesTransform);
  return templates;
}

console.log(getTemplates(ast));
