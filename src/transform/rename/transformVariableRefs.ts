import transform from "..";
import { idTransform } from "../../util";
import Scope from "./Scope";
import toScopedAST, { ScopedAST } from "./toScopedAst";
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
    const registerDecls = transform<ScopedAST, ScopedVariableAST>(program, {
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
        default: idTransform
    }) as ScopedVariableAST;

    const registerRefs = transform<ScopedVariableAST, ScopedVariableAST>(registerDecls, {
        extends_clause: (node, children) => {
            console.log(children)
            const ids = children.filter(c => c.type === 'identifier' || c.type === 'type_identifier');
            const newChildren = ids.reduce<ScopedVariableAST[]>((prev, _id) => {
                const id = _id as ScopedAST
                const decl = id.scope.lookup(id.text)

                if(decl === undefined) {
                    throw new Error(`Cannot extend undefined class, ${id.text}`);
                }

                const newId = {
                    type: 'variable',
                    origType: id.type,
                    var: decl,
                    children: [],
                    scope: id.scope
                } as ScopedVariableAST

                return replace(prev, newId, (el) => el === _id);
            }, children);
            console.log(newChildren)
            return {
                ...node,
                children: newChildren
            } as ScopedVariableAST
        },
        new_expression: (node, children) => {
            const id = children.find(c => c.type === 'identifier') as ScopedAST;
            const decl = id.scope.lookup(id.text);

            if(decl === undefined) {
                throw new Error(`Cannot instantiate undefined class, ${id.text}`);
            }

            const newId : ScopedVariableAST = {
                type: 'variable',
                origType: id.type,
                var: decl,
                children: [],
                scope: id.scope
            }
            return {
                ...node,
                children: replace(children, newId, el => el === id)
            } as ScopedVariableAST
        },
        default: idTransform
    }) as ScopedVariableAST;
    return registerRefs
}