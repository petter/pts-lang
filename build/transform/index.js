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
Object.defineProperty(exports, '__esModule', { value: true });
exports.EMPTY_NODE = void 0;
function transform(node, transformer) {
    if (Array.isArray(node)) {
        return node.map(function (inp) {
            return transform(inp, transformer);
        });
    }
    var transformerObj =
        typeof transformer === 'object'
            ? transformer
            : transformer(function (inp) {
                  return transform(inp, transformer);
              });
    var transformedChildren = [transform(node.children, transformer)].flat();
    var transformFunc = transformerObj[node.type] || transformerObj.default;
    return transformFunc(__assign({}, node), transformedChildren);
}
exports.default = transform;
exports.EMPTY_NODE = [];
