"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var prettier_1 = __importDefault(require("prettier"));
var transform_1 = __importDefault(require("../transform"));
function toTS(program) {
    var unformatted = transform_1.default(program, {
        template_declaration: function () { return ""; },
        package_declaration: function (_, children) { return children.slice(2).join(""); },
        package_template_body: function (_, children) { return children.slice(1, -1).join("\n"); },
        member_expression: function (_, children) { return children.join(''); },
        program: function (_, children) { return children.join('\n'); },
        class_body: function (_, children) { return children.join('\n'); },
        statement_block: function (_, children) { return children.join('\n'); },
        string: function (node, _) { return node.text; },
        default: function (node, children) {
            if (children.length === 0) {
                return node.text;
            }
            else {
                return children.join(" ");
            }
        },
    });
    return prettier_1.default.format(unformatted, { semi: true, parser: "babel", tabWidth: 4 });
}
exports.default = toTS;
