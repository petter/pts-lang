import { ASTNode } from "../../AST";
import toOriginalAST from "./toOriginalAST";
import toScopedAST from "./toScopedAst";
import transformVariableRefs from "./transformVariableRefs";

type Renaming = { old: string; new: string };
type ClassRenaming = Renaming & { fields: Renaming[] };

export default function rename(
    renamings: ClassRenaming[],
    body: ASTNode[]
): ASTNode[] {
    const root = {
        type: 'temp_root',
        children: body,
        text: ''
    }
    const scopedAST = toScopedAST(root);
    const variableRefTransformedAST = transformVariableRefs(scopedAST);
    renamings.forEach((classRenaming) => {
        variableRefTransformedAST.scope.rename(classRenaming.old, classRenaming.new);
        classRenaming.fields.forEach((fieldRenaming) =>
            variableRefTransformedAST.scope.renameField(classRenaming.old, fieldRenaming.old, fieldRenaming.new)
        );
    });
    const renamedAST = toOriginalAST(variableRefTransformedAST);
    return renamedAST.children;
}


