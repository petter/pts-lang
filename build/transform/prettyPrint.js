"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transform_1 = __importDefault(require("../transform"));
function prettyPrint(program) {
    return transform_1.default(program, {
        default: (node, children) => {
            if (children.length === 0) {
                return node.text;
            }
            else {
                return children.join(' ');
            }
        },
    });
}
exports.default = prettyPrint;
