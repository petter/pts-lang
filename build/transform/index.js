"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_NODE = void 0;
function transform(node, transformer) {
    if (Array.isArray(node)) {
        return node.map((inp) => transform(inp, transformer));
    }
    const transformerObj = typeof transformer === 'object' ? transformer : transformer((inp) => transform(inp, transformer));
    const transformedChildren = [
        transform(node.children, transformer),
    ].flat();
    const transformFunc = transformerObj[node.type] || transformerObj.default;
    return transformFunc({ ...node }, transformedChildren);
}
exports.default = transform;
exports.EMPTY_NODE = [];
