import transform from "..";
import Scope from "./Scope";
import { ScopedAST } from "./toScopedAst";
import Variable from "./Variable";

function findLast<T>(elements: T[], check : (el : T) => boolean) : T | undefined {
    const ts = elements.filter(check)
    if(ts.length === 0) return undefined;
    return ts[ts.length - 1]
}

function replace<T>(elements: T[], replaceWith : T, check : (el : T) => boolean) : T[] {
    return elements.map(el => check(el) ? replaceWith : el);
}

export type ScopedVariableAST = ScopedAST | {type: 'variable', origType: string, var: Variable, children: ScopedVariableAST[], scope: Scope};

export default function transformVariableRefs(program: ScopedAST) : ScopedVariableAST {
    return transform<ScopedAST, ScopedVariableAST>(program, {
        class_declaration: (classDeclNode, classDeclChildren) => {
            const tId = findLast(classDeclChildren, (c) => c.type === 'type_identifier') as ScopedAST
            const varDecl = classDeclNode.scope.defineClass(tId?.text || "");
            const astVarNode = {
                type: 'variable', 
                origType: tId.type,
                var: varDecl, 
                children: [], 
                scope: classDeclNode.scope
            } as ScopedVariableAST;
            return {
                ...classDeclNode,
                children: replace(classDeclChildren, astVarNode, (el) => el === tId)
            } as ScopedVariableAST
        },
        default: (node, children) => ({
            ...node,
            children
        }) as ScopedVariableAST
    }) as ScopedVariableAST;
}