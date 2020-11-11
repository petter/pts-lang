import Parser from "tree-sitter";
import fs from "fs";

// tslint:disable-next-line: no-var-requires
const PTS = require("tree-sitter-pts");

const parser = new Parser();
parser.setLanguage(PTS);

const content = fs.readFileSync(
  "./examples/inst-template-in-template.pts",
  "utf-8"
);

const parseTree = parser.parse(content);

prettyPrinter(parseTree.walk(), 0);

function prettyPrinter(cursor: Parser.TreeCursor, indent: number) {
  console.log("  ".repeat(indent) + cursor.nodeType);
  if (cursor.gotoFirstChild()) prettyPrinter(cursor, indent + 1);
  if (cursor.gotoNextSibling()) prettyPrinter(cursor, indent);
  cursor.gotoParent();
}

function registerTemplates(program: Parser.SyntaxNode) {
  const templateDecls = program.children.filter(
    (child) => child.type === "template_declaration"
  );

  return templateDecls.map((templateDecl) => {
    const identifier = templateDecl.children.find(
      (child) => child.type === "identifier"
    )?.text;
    const body = templateDecl.children.find(
      (child) => child.type === "package_template_body"
    )?.children;
    return { identifier, body };
  });
}

const templates = registerTemplates(parseTree.rootNode);
console.log(templates);
