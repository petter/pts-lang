"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = __importDefault(require("../../index"));
var util_1 = require("../../../util");
var Class_1 = __importDefault(require("./Class"));
function findLast(elements, check) {
    var ts = elements.filter(check);
    if (ts.length === 0)
        return undefined;
    return ts[ts.length - 1];
}
function transformVariableRefs(program) {
    var registerClassDecls = index_1.default(program, {
        class_declaration: function (node, children) {
            var tId = findLast(children, function (c) { return c.type === 'type_identifier'; });
            var classScope = children.find(function (el) { return el.type === 'class_body'; }).scope;
            var varDecl = node.scope.defineClass(tId.text || "", classScope);
            classScope.defineVariable("this", tId.text);
            var astVarNode = {
                type: 'variable',
                origType: tId.type,
                var: varDecl,
                children: [],
                scope: node.scope
            };
            return __assign(__assign({}, node), { children: util_1.replace(children, astVarNode, function (el) { return el === tId; }) });
        },
        default: util_1.idTransform
    });
    var registerDecls = index_1.default(registerClassDecls, {
        // Register superclass
        class_declaration: function (node, children) {
            var _a, _b;
            // TODO: Add implementing interfaces
            var cl = children.find(function (el) { return el.type === 'variable'; }).var;
            var heritage = (_b = (_a = children.find(function (el) { return el.type === 'class_heritage'; })) === null || _a === void 0 ? void 0 : _a.children[0].children) === null || _b === void 0 ? void 0 : _b.filter(function (c) { return c.type === 'variable'; });
            var superClass = heritage === null || heritage === void 0 ? void 0 : heritage.map(function (el) { return el.var; }).find(function (el) { return el instanceof Class_1.default; });
            if (superClass !== undefined) {
                cl.addSuperClass(superClass);
            }
            return __assign(__assign({}, node), { children: children });
        },
        extends_clause: function (node, children) {
            var ids = children.filter(function (c) { return c.type === 'identifier' || c.type === 'type_identifier'; });
            var newChildren = ids.reduce(function (prev, _id) {
                var id = _id;
                var decl = id.scope.lookup(id.text);
                if (decl === undefined) {
                    throw new Error("Cannot extend undefined class, " + id.text);
                }
                var newId = {
                    type: 'variable',
                    origType: id.type,
                    var: decl,
                    children: [],
                    scope: id.scope
                };
                return util_1.replace(prev, newId, function (el) { return el === _id; });
            }, children);
            return __assign(__assign({}, node), { children: newChildren });
        },
        public_field_definition: function (node, children) {
            var id = children.find(function (c) { return c.type === 'property_identifier'; });
            var newExpr = children.find(function (c) { return c.type === 'new_expression'; });
            var instanceOf;
            if (newExpr !== undefined && newExpr.type === 'new_expression') {
                var instId = newExpr.children.find(function (c) { return c.type === 'identifier'; });
                instanceOf = instId.text;
            }
            var decl = {
                type: 'variable',
                origType: id.type,
                var: id.scope.defineVariable(id.text, instanceOf),
                children: [],
                scope: node.scope
            };
            return __assign(__assign({}, node), { children: util_1.replace(children, decl, function (c) { return c === id; }) });
        },
        default: util_1.idTransform
    });
    var registerRefs = index_1.default(registerDecls, {
        new_expression: function (node, children) {
            var id = children.find(function (c) { return c.type === 'identifier'; });
            var decl = id.scope.lookup(id.text);
            if (decl === undefined) {
                throw new Error("Cannot instantiate undefined class, " + id.text);
            }
            var newId = {
                type: 'variable',
                origType: id.type,
                var: decl,
                children: [],
                scope: id.scope
            };
            return __assign(__assign({}, node), { children: util_1.replace(children, newId, function (el) { return el === id; }) });
        },
        'this': function (node, children) { return ({
            type: 'variable',
            origType: node.type,
            var: node.scope.lookup('this'),
            children: [],
            scope: node.scope
        }); },
        member_expression: function (node, children) {
            if (children[0].type === 'variable') {
                // this.i or a.i
                var varNode = children[0];
                var id_1 = children[2];
                var fieldClass = varNode.var.instanceOf;
                if (fieldClass === undefined) {
                    // the variable is probably a object, which we can not rename at the moment.
                    return __assign(__assign({}, node), { children: children });
                }
                var varDecl = fieldClass.lookup(id_1.text);
                if (varDecl === undefined) {
                    throw new Error(id_1.text + " does not exist on this"); // Kanskje bedre å bare la typescript ta seg av denne?
                }
                var newId = {
                    type: 'variable',
                    origType: id_1.type,
                    var: varDecl,
                    children: [],
                    scope: id_1.scope
                };
                return __assign(__assign({}, node), { children: util_1.replace(children, newId, function (el) { return el === id_1; }) });
            }
            else if (children[0].type === 'member_expression') {
                // this.a.i, a.i.j, etc
                // TODO: Handle this
                var id_2 = children[2];
                var memberOf = children[0].children[2];
                var memberOfInstance = memberOf.var.instanceOf;
                if (memberOfInstance === undefined) {
                    // I'm a member of something we can not rename, i.e. object, console.log, etc.
                    return __assign(__assign({}, node), { children: children });
                }
                var varDecl = memberOfInstance.lookup(id_2.text);
                if (varDecl === undefined) {
                    throw new Error(id_2.text + " does not exist on class " + memberOfInstance.origName);
                }
                var newId = {
                    type: 'variable',
                    origType: id_2.type,
                    var: varDecl,
                    children: [],
                    scope: id_2.scope
                };
                return __assign(__assign({}, node), { children: util_1.replace(children, newId, function (el) { return el === id_2; }) });
            }
            else if (children[0].type === 'identifier') {
                // a.i
                // TODO: Handle this
                var memberOfId = children[0];
                var memberId = children[2];
                var memberOfVarDecl = node.scope.lookup(memberOfId.text);
                if (memberOfVarDecl === undefined || memberOfVarDecl.instanceOf === undefined) {
                    // I'm something that can not be renamed, i.e. console.log
                    return __assign(__assign({}, node), { children: children });
                }
                var memberVarDecl = memberOfVarDecl.instanceOf.lookup(memberId.text);
                var memberOfVarNode = {
                    type: 'variable',
                    origType: memberOfId.type,
                    var: memberOfVarDecl,
                    children: [],
                    scope: node.scope
                };
                var memberVarNode = {
                    type: 'variable',
                    origType: memberId.type,
                    var: memberVarDecl,
                    children: [],
                    scope: node.scope
                };
                return __assign(__assign({}, node), { children: [memberOfVarNode, children[1], memberVarNode] });
            }
            else {
                throw new Error('Unhandled member_expression. children[0].type = ' + children[0].type);
            }
        },
        default: util_1.idTransform
    });
    return registerRefs;
}
exports.default = transformVariableRefs;
