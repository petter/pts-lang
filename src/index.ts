import Parser from "tree-sitter";
import fs from "fs";

// tslint:disable-next-line: no-var-requires
const PTS = require("tree-sitter-pts");

const parser = new Parser();
parser.setLanguage(PTS);

const content = fs.readFileSync("./examples/closed-template.pts", "utf-8");

const parseTree = parser.parse(content);
console.log(parseTree.rootNode.toString());

prettyPrinter(parseTree.walk(), 0);

function prettyPrinter(cursor: Parser.TreeCursor, indent: number) {
  console.log("  ".repeat(indent) + cursor.nodeType);
  if (cursor.gotoFirstChild()) prettyPrinter(cursor, indent + 1);
  if (cursor.gotoNextSibling()) prettyPrinter(cursor, indent);
  cursor.gotoParent();
}
