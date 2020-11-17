import Parser from "tree-sitter";
import fs from "fs";
import toAST from "./AST";

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

console.log(ast);
