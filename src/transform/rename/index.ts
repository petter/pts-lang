import { ASTNode } from "../../AST";
import Scope from "./Scope"

type Renaming = { old: string; new: string };
type ClassRenaming = Renaming & { fields: Renaming[] };

export default function rename(
    renamings: ClassRenaming[],
    body: ASTNode[]
): ASTNode[] {
    return body;
}

