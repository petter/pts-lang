import transform from "../../index";
import {idTransform, replace, typeIs} from "../../../util";
import Scope from "./Scope";
import { ScopedAST } from "./toScopedAst";
import Variable from "./Variable";
import Class from "./Class";

const MEMBER_OF = 0;
const MEMBER = 2;

function findLast<T>(elements: T[], check : (el : T) => boolean) : T | undefined {
    const ts = elements.filter(check)
    if(ts.length === 0) return undefined;
    return ts[ts.length - 1]
}

export type VarNode = {type: 'variable', origType: string, var: Variable, children: ScopedVariableAST[], scope: Scope};
export type ScopedVariableAST = (ScopedAST & {children: ScopedVariableAST}) | VarNode;

export default function transformVariableRefs(program: ScopedAST) : ScopedVariableAST {
    const declarationRegisteredNode = registerDeclarations(program)
    const registerRefs = transform<ScopedVariableAST, ScopedVariableAST>(declarationRegisteredNode, {
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

            if(children[MEMBER_OF].type === 'variable') {
                return memberOfVariable(node, children);
            } else if (children[MEMBER_OF].type === 'member_expression') {
                return memberOfMember(node, children);
            } else if(children[MEMBER_OF].type === 'identifier') {
                return memberOfIdentifier(node, children);
            } else {
                throw new Error('Unhandled member_expression. children[MEMBER_OF].type = ' + children[MEMBER_OF].type);
            }
        },
        default: idTransform
    }) as ScopedVariableAST;
    return registerRefs
}

function registerDeclarations(astNode: ScopedAST) {
    const nodeWithClassDeclsRegistered = registerClassDeclarations(astNode);
    return registerRestOfTheDeclarations(nodeWithClassDeclsRegistered);
}

function registerClassDeclarations(astNode: ScopedAST) : ScopedVariableAST {
    return transform(astNode, {
        class_declaration: (node, children) => {
            const tId = findLast(children, typeIs('type_identifier')) as ScopedAST
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
            }
        },
        default: idTransform
    });
}

function registerRestOfTheDeclarations(nodeWithClassDeclsRegistered: ScopedVariableAST) : ScopedVariableAST {
    return transform<ScopedVariableAST, ScopedVariableAST>(nodeWithClassDeclsRegistered, {
        // Register superclass
        class_declaration: (node, children) => {
            // TODO: Add implementing interfaces
            const cl = (children.find(el => el.type === 'variable') as VarNode).var as Class;
            const heritage = (children.find(el => el.type === 'class_heritage')?.children[0].children as ScopedVariableAST[] | undefined)?.filter(c => c.type === 'variable') as VarNode[] | undefined;
            const superClass = heritage?.map((el) => el.var).find(el => el instanceof Class) as Class | undefined;
            if(superClass !== undefined) {
                cl.addSuperClass(superClass);
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
}

function memberOfVariable (node: ScopedVariableAST, children : ScopedVariableAST[]) : ScopedVariableAST {
    // this.i or a.i
    const varNode = children[MEMBER_OF] as {type: 'variable', origType: string, var: Variable, children: ScopedVariableAST[], scope: Scope};
    const id = children[MEMBER] as ScopedAST;
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

    const newChildren = [...children];
    newChildren[MEMBER] = newId;

    return {
        ...node,
        children: newChildren,
    } as ScopedVariableAST
}

function memberOfMember(node: ScopedVariableAST, children: ScopedVariableAST[]) {
    // this.a.i, a.i.j, etc
    const id = (children[MEMBER] as ScopedAST);
    const memberOf = children[MEMBER_OF].children[MEMBER] as unknown as VarNode;
    const memberOfInstance = memberOf.var.instanceOf;
    if(memberOfInstance === undefined) {
        // I'm a member of something we can not rename, i.e. object, console.log, etc.
        return {...node, children} as ScopedVariableAST;
    }

    const varDecl = memberOfInstance.lookup(id.text);

    if (varDecl === undefined) {
        throw new Error(`${id.text} does not exist on class ${memberOfInstance.origName}`);
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
    } as ScopedVariableAST;
}

function memberOfIdentifier(node: ScopedVariableAST, children: ScopedVariableAST[]) : ScopedVariableAST {
    // TODO: Can this happen? How is this different from memberOfVariable?
    // a.i
    // TODO: Handle this
    const memberOfId = children[MEMBER_OF] as ScopedAST;
    const memberId = children[2] as ScopedAST;
    console.log('memberOfIdentifier?', memberOfId.text + '.' + memberId.text)

    const memberOfVarDecl = node.scope.lookup(memberOfId.text);
    if(memberOfVarDecl === undefined || memberOfVarDecl.instanceOf === undefined) {
        // I'm something that can not be renamed, i.e. console.log
        return {...node, children} as ScopedVariableAST;
    }

    const memberVarDecl = memberOfVarDecl.instanceOf.lookup(memberId.text);

    if(memberVarDecl === undefined) {
        throw new Error(`${memberId.text} does not exist on object ${memberOfId.text}`);
    }

    const memberOfVarNode : VarNode = {
        type: 'variable',
        origType: memberOfId.type,
        var: memberOfVarDecl,
        children: [],
        scope: node.scope
    };
    const memberVarNode : VarNode = {
        type: 'variable',
        origType: memberId.type,
        var: memberVarDecl,
        children: [],
        scope: node.scope
    };

    return {
        ...node,
        children: [memberOfVarNode, children[1], memberVarNode]
    } as ScopedVariableAST;
}