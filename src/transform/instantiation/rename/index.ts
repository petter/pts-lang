import { ASTNode } from "../../../AST";
import toScopedAST from "../scope/toScopedAst";
import toOriginalAST from "../scope/toOriginalAST";

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
    renamings.forEach((classRenaming) => {
        scopedAST.scope.rename(classRenaming.old, classRenaming.new);
        classRenaming.fields.forEach((fieldRenaming) =>
            scopedAST.scope.renameField(classRenaming.old, fieldRenaming.old, fieldRenaming.new)
        );
    });
    return (toOriginalAST(scopedAST) as ASTNode).children;

}


