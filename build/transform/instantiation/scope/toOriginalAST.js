'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
var index_1 = __importDefault(require('../../index'));
function toOriginalAST(program) {
    if (Array.isArray(program)) {
        return program.map(toOriginalAST);
    }
    return index_1.default(program, {
        variable: function (node, children) {
            return {
                type: node.origType,
                text: node.var.toString(),
                children: children,
            };
        },
        default: function (node, children) {
            return {
                type: node.type,
                text: node.text,
                children: children,
            };
        },
    });
}
exports.default = toOriginalAST;
