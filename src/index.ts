import Parser from "tree-sitter";
import fs from "fs";
import { toAST, ASTNode } from "./AST";
import transform, { Transformer, Transform } from "./transform";
import replaceInstantiations from "./transform/replaceInstantiations";
import getTemplates from "./util/getTemplates";
import toTS from "./transform/toTS";

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


try {
  const inst = replaceInstantiations(ast)
  const newTemplates = getTemplates(inst)
  console.log(newTemplates.map(el => el.body))

  fs.writeFileSync("out.ts", toTS(inst))
} catch (e) {
  console.error(e)
  process.exit(1)
}