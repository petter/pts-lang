"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../../index"));
const util_1 = require("../../../util");
const Class_1 = __importDefault(require("./Class"));
const MEMBER_OF = 0;
const MEMBER = 2;
function findLast(elements, check) {
    const ts = elements.filter(check);
    if (ts.length === 0)
        return undefined;
    return ts[ts.length - 1];
}
class VariableTransformer {
    constructor(program) {
        this.program = program;
    }
}
function transformVariableRefs(program) {
    const declarationRegisteredNode = registerDeclarations(program);
    const registerRefs = index_1.default(declarationRegisteredNode, {
        new_expression: (node, children) => {
            const id = children.find((c) => c.type === 'identifier');
            const decl = id.scope.lookup(id.text);
            if (decl === undefined) {
                throw new Error(`Cannot instantiate undefined class, ${id.text}`);
            }
            const newId = {
                type: 'variable',
                origType: id.type,
                var: decl,
                children: [],
                scope: id.scope,
            };
            return {
                ...node,
                children: util_1.replace(children, newId, (el) => el === id),
            };
        },
        this: (node) => ({
            type: 'variable',
            origType: node.type,
            var: node.scope.lookup('this'),
            children: [],
            scope: node.scope,
        }),
        member_expression: (node, children) => {
            if (children[MEMBER_OF].type === 'variable') {
                return memberOfVariable(node, children);
            }
            else if (children[MEMBER_OF].type === 'member_expression') {
                return memberOfMember(node, children);
            }
            else if (children[MEMBER_OF].type === 'identifier') {
                return memberOfIdentifier(node, children);
            }
            else {
                throw new Error('Unhandled member_expression. children[MEMBER_OF].type = ' + children[MEMBER_OF].type);
            }
        },
        default: util_1.idTransform,
    });
    return registerRefs;
}
exports.default = transformVariableRefs;
function registerDeclarations(astNode) {
    const nodeWithClassDeclsRegistered = registerClassDeclarations(astNode);
    return registerRestOfTheDeclarations(nodeWithClassDeclsRegistered);
}
function registerClassDeclarations(astNode) {
    return index_1.default(astNode, {
        class_declaration: (node, children) => {
            const tId = findLast(children, util_1.typeIs('type_identifier'));
            const classScope = children.find((el) => el.type === 'class_body').scope;
            const varDecl = node.scope.defineClass(tId.text || '', classScope);
            classScope.defineVariable('this', tId.text);
            const astVarNode = {
                type: 'variable',
                origType: tId.type,
                var: varDecl,
                children: [],
                scope: node.scope,
            };
            return {
                ...node,
                children: util_1.replace(children, astVarNode, (el) => el === tId),
            };
        },
        default: util_1.idTransform,
    });
}
function registerRestOfTheDeclarations(nodeWithClassDeclsRegistered) {
    return index_1.default(nodeWithClassDeclsRegistered, {
        // Register superclass
        class_declaration: (node, children) => {
            // TODO: Add implementing interfaces
            const cl = children.find((el) => el.type === 'variable').var;
            const heritage = children.find((el) => el.type === 'class_heritage')?.children[0].children?.filter((c) => c.type === 'variable');
            const superClass = heritage?.map((el) => el.var).find((el) => el instanceof Class_1.default);
            if (superClass !== undefined) {
                cl.addSuperClass(superClass);
            }
            return { ...node, children };
        },
        extends_clause: (node, children) => {
            const ids = children.filter((c) => c.type === 'identifier' || c.type === 'type_identifier');
            const newChildren = ids.reduce((prev, _id) => {
                const id = _id;
                const decl = id.scope.lookup(id.text);
                if (decl === undefined) {
                    throw new Error(`Cannot extend undefined class, ${id.text}`);
                }
                const newId = {
                    type: 'variable',
                    origType: id.type,
                    var: decl,
                    children: [],
                    scope: id.scope,
                };
                return util_1.replace(prev, newId, (el) => el === _id);
            }, children);
            return {
                ...node,
                children: newChildren,
            };
        },
        public_field_definition: (node, children) => {
            const id = children.find((c) => c.type === 'property_identifier');
            const newExpr = children.find((c) => c.type === 'new_expression');
            let instanceOf;
            if (newExpr !== undefined && newExpr.type === 'new_expression') {
                const instId = newExpr.children.find((c) => c.type === 'identifier');
                instanceOf = instId.text;
            }
            const decl = {
                type: 'variable',
                origType: id.type,
                var: id.scope.defineVariable(id.text, instanceOf),
                children: [],
                scope: node.scope,
            };
            return {
                ...node,
                children: util_1.replace(children, decl, (c) => c === id),
            };
        },
        default: util_1.idTransform,
    });
}
function memberOfVariable(node, children) {
    // this.i or a.i
    const varNode = children[MEMBER_OF];
    const id = children[MEMBER];
    const fieldClass = varNode.var.instanceOf;
    if (fieldClass === undefined) {
        // the variable is probably a object, which we can not rename at the moment.
        return { ...node, children };
    }
    const varDecl = fieldClass.lookup(id.text);
    if (varDecl === undefined) {
        throw new Error(`${id.text} does not exist on this`); // Kanskje bedre å bare la typescript ta seg av denne?
    }
    const newId = {
        type: 'variable',
        origType: id.type,
        var: varDecl,
        children: [],
        scope: id.scope,
    };
    const newChildren = [...children];
    newChildren[MEMBER] = newId;
    return {
        ...node,
        children: newChildren,
    };
}
function memberOfMember(node, children) {
    // this.a.i, a.i.j, etc
    const id = children[MEMBER];
    const memberOf = children[MEMBER_OF].children[MEMBER];
    const memberOfInstance = memberOf.var.instanceOf;
    if (memberOfInstance === undefined) {
        // I'm a member of something we can not rename, i.e. object, console.log, etc.
        return { ...node, children };
    }
    const varDecl = memberOfInstance.lookup(id.text);
    if (varDecl === undefined) {
        throw new Error(`${id.text} does not exist on class ${memberOfInstance.origName}`);
    }
    const newId = {
        type: 'variable',
        origType: id.type,
        var: varDecl,
        children: [],
        scope: id.scope,
    };
    return {
        ...node,
        children: util_1.replace(children, newId, (el) => el === id),
    };
}
function memberOfIdentifier(node, children) {
    // TODO: Can this happen? How is this different from memberOfVariable?
    // a.i
    const memberOfId = children[MEMBER_OF];
    const memberId = children[2];
    console.log('memberOfIdentifier?', memberOfId.text + '.' + memberId.text);
    const memberOfVarDecl = node.scope.lookup(memberOfId.text);
    if (memberOfVarDecl === undefined || memberOfVarDecl.instanceOf === undefined) {
        // I'm something that can not be renamed, i.e. console.log
        return { ...node, children };
    }
    const memberVarDecl = memberOfVarDecl.instanceOf.lookup(memberId.text);
    if (memberVarDecl === undefined) {
        throw new Error(`${memberId.text} does not exist on object ${memberOfId.text}`);
    }
    const memberOfVarNode = {
        type: 'variable',
        origType: memberOfId.type,
        var: memberOfVarDecl,
        children: [],
        scope: node.scope,
    };
    const memberVarNode = {
        type: 'variable',
        origType: memberId.type,
        var: memberVarDecl,
        children: [],
        scope: node.scope,
    };
    return {
        ...node,
        children: [memberOfVarNode, children[1], memberVarNode],
    };
}
