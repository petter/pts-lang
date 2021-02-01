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
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
var index_1 = __importDefault(require('../../index'));
var Scope_1 = __importDefault(require('./Scope'));
var transformVariableRefs_1 = __importDefault(require('./transformVariableRefs'));
function setScope(node, scope) {
    return __assign(__assign({}, node), {
        children: node.children.map(function (c) {
            return setScope(c, scope);
        }),
        scope: scope,
    });
}
function toScopedAST(program) {
    var rootScope = new Scope_1.default(undefined);
    var rootScopedAst = setScope(program, rootScope);
    var scopedAst = index_1.default(rootScopedAst, function (revisit) {
        var makeScope = function (node, _) {
            var scope = new Scope_1.default(node.scope);
            var scopedChildren = revisit(
                node.children.map(function (child) {
                    return setScope(child, scope);
                }),
            );
            return __assign(__assign({}, node), { children: scopedChildren, scope: scope });
        };
        return {
            class_body: makeScope,
            statement_block: makeScope,
            enum_body: makeScope,
            if_statement: makeScope,
            else_statement: makeScope,
            for_statement: makeScope,
            for_in_statement: makeScope,
            while_statement: makeScope,
            do_statement: makeScope,
            try_statement: makeScope,
            with_statement: makeScope,
            default: function (node, children) {
                return __assign(__assign({}, node), { children: children });
            },
        };
    });
    return transformVariableRefs_1.default(scopedAst);
}
exports.default = toScopedAST;
