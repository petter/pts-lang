import { notDeepEqual } from "assert";
import { ASTNode } from "../../AST";
import transform from "../index";
import Scope from "./Scope";
import Variable from "./Variable";

type Renaming = { old: string; new: string };
type ClassRenaming = Renaming & { fields: Renaming[] };

type ScopedAST =
    {
        type: string;
        children: ScopedAST[];
        scope: Scope;
    } & (
        {
            isVariable: true;
            variable: Variable;
        } | {
            isVariable: false;
            text: string
        })


export default function rename(
    renamings: ClassRenaming[],
    body: ASTNode[]
): ASTNode[] {
    const root = {
        type: 'temp_root',
        children: body,
        text: ''
    }
    const scopedAst = toScopedAST(root);
    console.log(scopedAst)
    return body;
}



function toScopedAST(program: ASTNode) : ScopedAST {
    const rootScope = new Scope(undefined);
    function setScope<Inp extends {children: Inp[]}>(node : Inp, scope : Scope) : Inp & {scope: Scope} {
        return {
            ...node,
            children: node.children.map(c => setScope(c, scope)),
            scope
        };
    }

    const rootScopedAst = setScope(program, rootScope);

    return transform<ASTNode & {scope: Scope}, ScopedAST>(rootScopedAst, (revisit) => ({
        class_body: ({children, ...node}, _) => {
            const scope = new Scope(node.scope);
            const scopedChildren = revisit(children.map(child => setScope(child, scope)));
            return {
                ...node,
                children: scopedChildren,
                scope,
                isVariable: false,
                text: node.text
            }
        },
        default: (node, children) => ({
            type: node.type,
            children,
            scope: node.scope,
            isVariable: false,
            text: node.text
        })
    })) as ScopedAST;
}

