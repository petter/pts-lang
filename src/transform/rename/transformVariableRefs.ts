import transform from "..";
import { idTransform } from "../../util";
import Scope from "./Scope";
import { ScopedAST } from "./toScopedAst";
import Variable from "./Variable";
import Class from "./Class";

function findLast<T>(elements: T[], check : (el : T) => boolean) : T | undefined {
    const ts = elements.filter(check)
    if(ts.length === 0) return undefined;
    return ts[ts.length - 1]
}

function replace<T>(elements: T[], replaceWith : T, check : (el : T) => boolean) : T[] {
    return elements.map(el => check(el) ? replaceWith : el);
}

type VarNode = {type: 'variable', origType: string, var: Variable, children: ScopedVariableAST[], scope: Scope};
export type ScopedVariableAST = ScopedAST | VarNode;

export default function transformVariableRefs(program: ScopedAST) : ScopedVariableAST {
    const registerClassDecls = transform<ScopedAST, ScopedVariableAST>(program, {
        class_declaration: (node, children) => {
            const tId = findLast(children, (c) => c.type === 'type_identifier') as ScopedAST
            const classScope = children.find(el => el.type === 'class_body')!.scope
            const varDecl = node.scope.defineClass(tId.text || "", classScope);
            classScope.defineVariable("this", tId.text);
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
        // Register superclass
        class_declaration: (node, children) => {
            // TODO: Add implementing interfaces
            const cl = (children.find(el => el.type === 'variable') as VarNode).var as Class;
            const heritage = (children.find(el => el.type === 'class_heritage')?.children[0].children as ScopedVariableAST[] | undefined)?.filter(c => c.type === 'variable') as VarNode[] | undefined;
            const superClass = heritage?.map((el) => el.var).find(el => el instanceof Class) as Class | undefined;
            if(superClass !== undefined) {
                cl.addSuperClass(superClass);
                console.log(cl, superClass)
            }

            return {...node, children} as ScopedVariableAST;
        },
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
        'this': (node, children) => ({
            type: 'variable',
            origType: node.type,
            var: node.scope.lookup('this')!,
            children: [],
            scope: node.scope
        }),
        member_expression: (node, children) => {

            if(children[0].type === 'variable') {
                // this.i or a.i
                const varNode = children[0] as {type: 'variable', origType: string, var: Variable, children: ScopedVariableAST[], scope: Scope};
                const id = children[2] as ScopedAST;
                const fieldClass = varNode.var.instanceOf
                if(fieldClass === undefined) {
                    // the variable is probably a object, which we can not rename at the moment.
                    return {...node, children} as ScopedVariableAST;
                }

                const varDecl = fieldClass.lookup(id.text)

                if(varDecl === undefined) {
                    throw new Error(`${id.text} does not exist on this`); // Kanskje bedre å bare la typescript ta seg av denne?
                }

                const newId : ScopedVariableAST = {
                    type: 'variable',
                    origType: id.type,
                    var: varDecl,
                    children: [],
                    scope: id.scope
                }

                return {
                    ...node,
                    children: replace(children, newId, (el) => el === id)
                } as ScopedVariableAST
            } else if (children[0].type === 'member_expression') {
                // this.a.i, a.i.j, etc
                // TODO: Handle this
                return {...node, children} as ScopedVariableAST;
            } else if(children[0].type === 'identifier') {
                // a.i
                // TODO: Handle this
                return {...node, children} as ScopedVariableAST;
            } else {
                throw new Error('Unhandled member_expression. children[0].type = ' + children[0].type);
            }
        },
        default: idTransform
    }) as ScopedVariableAST;
    return registerRefs
}