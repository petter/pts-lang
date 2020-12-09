import transform from "..";
import { idTransform } from "../../util";
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
    const registerClassDecls = transform<ScopedAST, ScopedVariableAST>(program, {
        class_declaration: (node, children) => {
            const tId = findLast(children, (c) => c.type === 'type_identifier') as ScopedAST
            const classScope = children.find(el => el.type === 'class_body')!.scope
            const varDecl = node.scope.defineClass(tId?.text || "", classScope);
            const astVarNode = {
                type: 'variable',
                origType: tId.type,
                var: varDecl,
                children: [],
                scope: node.scope
            } as ScopedVariableAST;
            return {
                ...node,
                children: replace(children, astVarNode, (el) => el === tId)
            } as ScopedVariableAST
        },
        default: idTransform
    }) as ScopedVariableAST;

    const registerDecls = transform<ScopedVariableAST, ScopedVariableAST>(registerClassDecls, {
        public_field_definition: (node, children) => {
            const id = children.find(c => c.type === 'property_identifier') as ScopedAST;
            const newExpr = children.find(c => c.type === 'new_expression')

            let instanceOf : string | undefined;
            if(newExpr !== undefined && newExpr.type === 'new_expression') {
                const instId = newExpr.children.find(c => c.type === 'identifier') as ScopedAST;
                instanceOf = instId.text;
            }
            const decl = {
                type: 'variable',
                origType: id.type,
                var: id.scope.defineVariable(id.text, instanceOf),
                children: [],
                scope: node.scope
            } as ScopedVariableAST
            return {
                ...node,
                children: replace(children, decl, (c) => c === id)
            } as ScopedVariableAST
    },
        default: idTransform
    }) as ScopedVariableAST;
    const registerRefs = transform<ScopedVariableAST, ScopedVariableAST>(registerDecls, {
        extends_clause: (node, children) => {
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