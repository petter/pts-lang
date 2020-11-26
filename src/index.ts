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


function fail(message: string) {
  console.error(message)
  process.exit(1)
}

const sExprTransformer: Transformer<ASTNode, string> = {
  default: (node, children) => `${node.type} (${children.join(", ")})`,
};
const sExprs = transform(ast, sExprTransformer);

const idTransform: Transform = (node, children) => ({ ...node, children });

function getTemplates(program: ASTNode) {
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


const templates = getTemplates(ast);

const inst = transform(ast, {
  template_declaration: (node, children) => {
      const identifier =
        children.find((child) => child.type === "identifier")?.text || "";
      const body =
        children.find((child) => child.type === "package_template_body")
          ?.children || [];

      if(templates.find(el => identifier === el.identifier)?.closed) {
        return idTransform(node, children)
      }
      
      let res : ASTNode | ASTNode[] = {...node, children}
      let inst = false;
      do {
        inst = false;
        res = transform(res, {
          inst_statement: (node, children) => {
            inst = true
            const instId = children.find(child => child.type === 'identifier')?.text || ""
            const template = templates.find(t => t.identifier === instId)
            if(template === undefined) {
              fail("Instantiating undefined template, " + instId)
              return idTransform(node, children) 
            } else {
              return template.body
            }
          },
          default: idTransform
        }) as ASTNode
      } while(inst)

      return res;
  },
  default: idTransform
}) as ASTNode


const newTemplates = getTemplates(inst)
console.log(newTemplates.map(el => el.body))