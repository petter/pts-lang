"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClosed = void 0;
const _1 = require(".");
const transform_1 = __importDefault(require("../transform"));
function isClosed(body) {
    return !body.some((child) => child.type === 'inst_statement');
}
exports.isClosed = isClosed;
function getTemplates(ast) {
    const templates = [];
    const findTemplatesTransform = {
        template_declaration: (node, children) => {
            const identifier = findByType(children, 'identifier')?.text || '';
            const body = findByType(children, 'package_template_body')?.children.slice(1, -1) || [];
            templates.push({ identifier, body, isClosed: isClosed(body) });
            return _1.idTransform(node, children);
        },
        default: _1.idTransform,
    };
    transform_1.default(ast, findTemplatesTransform);
    return templates;
}
exports.default = getTemplates;
const findByType = (children, type) => children.find(_1.typeIs(type));
