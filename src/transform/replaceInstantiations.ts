import { ASTNode } from "../AST";
import transform, { Transform } from "../transform";
import { idTransform } from "../util";
import getTemplates from "../util/getTemplates";
import rename from "./rename";

export default function replaceInstantiations(program: ASTNode) {
  const templates = getTemplates(program);

  const replaceInst: Transform = (instNode, instChildren) => {
    const identifier =
      instChildren.find((child) => child.type === "identifier")?.text || "";

    if (templates.find((el) => identifier === el.identifier)?.closed) {
      return idTransform(instNode, instChildren);
    }

    let res: ASTNode | ASTNode[] = { ...instNode, children: instChildren };
    let inst = false;
    do {
      inst = false;
      res = transform(res, {
        inst_statement: (_, children) => {
          inst = true;

          const instId =
            children.find((child) => child.type === "identifier")?.text || "";

          const renamings =
            children
              .find((el) => el.type === "class_renamings")
              ?.children.filter((child) => child.type === "class_rename")
              .map((el) => {
                const classRenaming = el.children[0];

                const fieldRenamings = el.children
                  .find((maybeFields) => maybeFields.type === "field_renamings")
                  ?.children.filter(
                    (maybeRename) => maybeRename.type === "rename"
                  )
                  .map((renaming) => ({
                    old: renaming.children[0].text,
                    new: renaming.children[2].text,
                  }));

                return {
                  old: classRenaming.children[0].text,
                  new: classRenaming.children[2].text,
                  fields: fieldRenamings || [],
                };
              }) || [];

          const template = templates.find((t) => t.identifier === instId);
          if (template === undefined) {
            throw new Error("Instantiating undefined template, " + instId);
          }

          const renamedBody = rename(renamings, template.body);
          return renamedBody;
        },
        default: idTransform,
      }) as ASTNode;
    } while (inst);

    return res;
  };

  return transform(program, {
    template_declaration: replaceInst,
    package_declaration: replaceInst,
    default: idTransform,
  }) as ASTNode;
}
