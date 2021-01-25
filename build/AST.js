"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAST = void 0;
function toAST(tree) {
    var cursor = tree.walk();
    function visitNode() {
        return {
            type: cursor.nodeType,
            text: cursor.nodeText,
            children: visitChildren(),
        };
    }
    function visitChildren() {
        var children = [];
        if (!cursor.gotoFirstChild())
            return children;
        do {
            children.push(visitNode());
        } while (cursor.gotoNextSibling());
        cursor.gotoParent();
        return children;
    }
    return visitNode();
}
exports.toAST = toAST;
