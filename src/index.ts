import Parser from "tree-sitter";
import fs from "fs";
import { toAST, ASTNode } from "./AST";
import transform, { Transformer } from "./transform";
import replaceInstantiations from "./transform/instantiation/replaceInstantiations";
import toTS from "./transform/toTS";
import toScopedAST from "./transform/instantiation/scope/toScopedAst";

// tslint:disable-next-line: no-var-requires
const PTS = require("tree-sitter-pts");

const parser = new Parser();
parser.setLanguage(PTS);

const content = fs.readFileSync(
  "./examples/full-class-rename.pts",
  "utf-8"
);

const parseTree = parser.parse(content);

const ast = toAST(parseTree);

const sExprTransformer: Transformer<ASTNode, string> = {
  default: (node, children) => `${node.type} (${children.join(", ")})`,
};
const sExprs = transform(ast, sExprTransformer);
console.log(sExprs);

try {
  const inst = replaceInstantiations(ast);

  fs.writeFileSync("out.ts", toTS(inst));
} catch (e) {
  console.error(e);
  process.exit(1);
}
