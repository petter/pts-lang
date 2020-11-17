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

// prettyPrinter(parseTree.walk(), 0);

function prettyPrinter(cursor: Parser.TreeCursor, indent: number) {
  console.log("  ".repeat(indent) + cursor.nodeType);
  if (cursor.gotoFirstChild()) prettyPrinter(cursor, indent + 1);
  if (cursor.gotoNextSibling()) prettyPrinter(cursor, indent);
  cursor.gotoParent();
}

interface Template {
  identifier: string;
  body: Parser.SyntaxNode[];
}

function registerTemplates(program: Parser.SyntaxNode): Template[] {
  const templateDecls = program.children.filter(
    (child) => child.type === "template_declaration"
  );

  return templateDecls.map((templateDecl) => {
    const identifier =
      templateDecl.children.find((child) => child.type === "identifier")
        ?.text || "";
    const body =
      templateDecl.children.find(
        (child) => child.type === "package_template_body"
      )?.children || [];
    return { identifier, body };
  });
}

function isClosed(body: Parser.SyntaxNode[]) {
  return !body.some((el) => el.type === "inst_statement");
}

const templates = registerTemplates(parseTree.rootNode);

const template = templates[0];

console.log(isClosed(template.body));
