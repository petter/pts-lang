import { ASTNode } from "../AST";
import transform, { Transform } from "../transform";
import { idTransform } from "../util";
import getTemplates from "../util/getTemplates";
import rename from "./rename";

export default function replaceInstantiations(program: ASTNode) {
  const templates = getTemplates(program);

  const replaceInst: Transform = (node, children) => {
    const identifier =
      children.find((child) => child.type === "identifier")?.text || "";

    if (templates.find((el) => identifier === el.identifier)?.closed) {
      return idTransform(node, children);
    }

    let res: ASTNode | ASTNode[] = { ...node, children };
    let inst = false;
    do {
      inst = false;
      res = transform(res, {
        inst_statement: (node, children) => {
          inst = true;

          const instId =
            children.find((child) => child.type === "identifier")?.text || "";
          
          console.log(children)

          const template = templates.find((t) => t.identifier === instId);
          if (template === undefined) {
            throw new Error("Instantiating undefined template, " + instId);
          }

          
          const renamedBody = rename(new Map(), template.body);
          return renamedBody;
        },
        default: idTransform,
      }) as ASTNode;
    } while (inst);

    return res;
  };

  const inst = transform(program, {
    template_declaration: replaceInst,
    package_declaration: replaceInst,
    default: idTransform,
  }) as ASTNode;

  return inst;
}
