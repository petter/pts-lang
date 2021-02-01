'use strict';
var __assign =
    (this && this.__assign) ||
    function () {
        __assign =
            Object.assign ||
            function (t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
        return __assign.apply(this, arguments);
    };
var __spreadArrays =
    (this && this.__spreadArrays) ||
    function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
        return r;
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
var index_1 = __importDefault(require('../../index'));
var util_1 = require('../../../util');
var Class_1 = __importDefault(require('./Class'));
var MEMBER_OF = 0;
var MEMBER = 2;
function findLast(elements, check) {
    var ts = elements.filter(check);
    if (ts.length === 0) return undefined;
    return ts[ts.length - 1];
}
function transformVariableRefs(program) {
    var declarationRegisteredNode = registerDeclarations(program);
    var registerRefs = index_1.default(declarationRegisteredNode, {
        new_expression: function (node, children) {
            var id = children.find(function (c) {
                return c.type === 'identifier';
            });
            var decl = id.scope.lookup(id.text);
            if (decl === undefined) {
                throw new Error('Cannot instantiate undefined class, ' + id.text);
            }
            var newId = {
                type: 'variable',
                origType: id.type,
                var: decl,
                children: [],
                scope: id.scope,
            };
            return __assign(__assign({}, node), {
                children: util_1.replace(children, newId, function (el) {
                    return el === id;
                }),
            });
        },
        this: function (node, children) {
            return {
                type: 'variable',
                origType: node.type,
                var: node.scope.lookup('this'),
                children: [],
                scope: node.scope,
            };
        },
        member_expression: function (node, children) {
            if (children[MEMBER_OF].type === 'variable') {
                return memberOfVariable(node, children);
            } else if (children[MEMBER_OF].type === 'member_expression') {
                return memberOfMember(node, children);
            } else if (children[MEMBER_OF].type === 'identifier') {
                return memberOfIdentifier(node, children);
            } else {
                throw new Error('Unhandled member_expression. children[MEMBER_OF].type = ' + children[MEMBER_OF].type);
            }
        },
        default: util_1.idTransform,
    });
    return registerRefs;
}
exports.default = transformVariableRefs;
function registerDeclarations(astNode) {
    var nodeWithClassDeclsRegistered = registerClassDeclarations(astNode);
    return registerRestOfTheDeclarations(nodeWithClassDeclsRegistered);
}
function registerClassDeclarations(astNode) {
    return index_1.default(astNode, {
        class_declaration: function (node, children) {
            var tId = findLast(children, util_1.typeIs('type_identifier'));
            var classScope = children.find(function (el) {
                return el.type === 'class_body';
            }).scope;
            var varDecl = node.scope.defineClass(tId.text || '', classScope);
            classScope.defineVariable('this', tId.text);
            var astVarNode = {
                type: 'variable',
                origType: tId.type,
                var: varDecl,
                children: [],
                scope: node.scope,
            };
            return __assign(__assign({}, node), {
                children: util_1.replace(children, astVarNode, function (el) {
                    return el === tId;
                }),
            });
        },
        default: util_1.idTransform,
    });
}
function registerRestOfTheDeclarations(nodeWithClassDeclsRegistered) {
    return index_1.default(nodeWithClassDeclsRegistered, {
        // Register superclass
        class_declaration: function (node, children) {
            var _a, _b;
            // TODO: Add implementing interfaces
            var cl = children.find(function (el) {
                return el.type === 'variable';
            }).var;
            var heritage =
                (_b =
                    (_a = children.find(function (el) {
                        return el.type === 'class_heritage';
                    })) === null || _a === void 0
                        ? void 0
                        : _a.children[0].children) === null || _b === void 0
                    ? void 0
                    : _b.filter(function (c) {
                          return c.type === 'variable';
                      });
            var superClass =
                heritage === null || heritage === void 0
                    ? void 0
                    : heritage
                          .map(function (el) {
                              return el.var;
                          })
                          .find(function (el) {
                              return el instanceof Class_1.default;
                          });
            if (superClass !== undefined) {
                cl.addSuperClass(superClass);
            }
            return __assign(__assign({}, node), { children: children });
        },
        extends_clause: function (node, children) {
            var ids = children.filter(function (c) {
                return c.type === 'identifier' || c.type === 'type_identifier';
            });
            var newChildren = ids.reduce(function (prev, _id) {
                var id = _id;
                var decl = id.scope.lookup(id.text);
                if (decl === undefined) {
                    throw new Error('Cannot extend undefined class, ' + id.text);
                }
                var newId = {
                    type: 'variable',
                    origType: id.type,
                    var: decl,
                    children: [],
                    scope: id.scope,
                };
                return util_1.replace(prev, newId, function (el) {
                    return el === _id;
                });
            }, children);
            return __assign(__assign({}, node), { children: newChildren });
        },
        public_field_definition: function (node, children) {
            var id = children.find(function (c) {
                return c.type === 'property_identifier';
            });
            var newExpr = children.find(function (c) {
                return c.type === 'new_expression';
            });
            var instanceOf;
            if (newExpr !== undefined && newExpr.type === 'new_expression') {
                var instId = newExpr.children.find(function (c) {
                    return c.type === 'identifier';
                });
                instanceOf = instId.text;
            }
            var decl = {
                type: 'variable',
                origType: id.type,
                var: id.scope.defineVariable(id.text, instanceOf),
                children: [],
                scope: node.scope,
            };
            return __assign(__assign({}, node), {
                children: util_1.replace(children, decl, function (c) {
                    return c === id;
                }),
            });
        },
        default: util_1.idTransform,
    });
}
function memberOfVariable(node, children) {
    // this.i or a.i
    var varNode = children[MEMBER_OF];
    var id = children[MEMBER];
    var fieldClass = varNode.var.instanceOf;
    if (fieldClass === undefined) {
        // the variable is probably a object, which we can not rename at the moment.
        return __assign(__assign({}, node), { children: children });
    }
    var varDecl = fieldClass.lookup(id.text);
    if (varDecl === undefined) {
        throw new Error(id.text + ' does not exist on this'); // Kanskje bedre å bare la typescript ta seg av denne?
    }
    var newId = {
        type: 'variable',
        origType: id.type,
        var: varDecl,
        children: [],
        scope: id.scope,
    };
    var newChildren = __spreadArrays(children);
    newChildren[MEMBER] = newId;
    return __assign(__assign({}, node), { children: newChildren });
}
function memberOfMember(node, children) {
    // this.a.i, a.i.j, etc
    var id = children[MEMBER];
    var memberOf = children[MEMBER_OF].children[MEMBER];
    var memberOfInstance = memberOf.var.instanceOf;
    if (memberOfInstance === undefined) {
        // I'm a member of something we can not rename, i.e. object, console.log, etc.
        return __assign(__assign({}, node), { children: children });
    }
    var varDecl = memberOfInstance.lookup(id.text);
    if (varDecl === undefined) {
        throw new Error(id.text + ' does not exist on class ' + memberOfInstance.origName);
    }
    var newId = {
        type: 'variable',
        origType: id.type,
        var: varDecl,
        children: [],
        scope: id.scope,
    };
    return __assign(__assign({}, node), {
        children: util_1.replace(children, newId, function (el) {
            return el === id;
        }),
    });
}
function memberOfIdentifier(node, children) {
    // TODO: Can this happen? How is this different from memberOfVariable?
    // a.i
    // TODO: Handle this
    var memberOfId = children[MEMBER_OF];
    var memberId = children[2];
    console.log('memberOfIdentifier?', memberOfId.text + '.' + memberId.text);
    var memberOfVarDecl = node.scope.lookup(memberOfId.text);
    if (memberOfVarDecl === undefined || memberOfVarDecl.instanceOf === undefined) {
        // I'm something that can not be renamed, i.e. console.log
        return __assign(__assign({}, node), { children: children });
    }
    var memberVarDecl = memberOfVarDecl.instanceOf.lookup(memberId.text);
    if (memberVarDecl === undefined) {
        throw new Error(memberId.text + ' does not exist on object ' + memberOfId.text);
    }
    var memberOfVarNode = {
        type: 'variable',
        origType: memberOfId.type,
        var: memberOfVarDecl,
        children: [],
        scope: node.scope,
    };
    var memberVarNode = {
        type: 'variable',
        origType: memberId.type,
        var: memberVarDecl,
        children: [],
        scope: node.scope,
    };
    return __assign(__assign({}, node), { children: [memberOfVarNode, children[1], memberVarNode] });
}
