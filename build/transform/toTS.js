"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prettier_1 = __importDefault(require("prettier"));
const transform_1 = __importDefault(require("../transform"));
function toTS(program) {
    console.log(program);
    const unformatted = transform_1.default(program, {
        template_declaration: () => '',
        package_declaration: (_, children) => children[2],
        package_template_body: (_, children) => children.slice(1, -1).join('\n'),
        member_expression: (_, children) => children.join(''),
        program: (_, children) => children.join('\n'),
        class_body: (_, children) => children.join('\n'),
        statement_block: (_, children) => children.join('\n'),
        string: (node) => node.text,
        default: (node, children) => {
            if (children.length === 0) {
                return node.text;
            }
            else {
                return children.join(' ');
            }
        },
    });
    try {
        return prettier_1.default.format(unformatted, { semi: true, parser: 'typescript', tabWidth: 4 });
    }
    catch (e) {
        console.error('Error while pretty printing program, returning unformatted output');
        return unformatted;
    }
}
exports.default = toTS;
