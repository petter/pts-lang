"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var transform_1 = __importDefault(require("../transform"));
function getTemplates(program) {
    function isClosed(body) {
        return !body.some(function (child) { return child.type === 'inst_statement'; });
    }
    var templates = [];
    var findTemplatesTransform = {
        template_declaration: function (node, children) {
            var _a, _b;
            var identifier = ((_a = children.find(function (child) { return child.type === "identifier"; })) === null || _a === void 0 ? void 0 : _a.text) || "";
            var body = ((_b = children.find(function (child) { return child.type === "package_template_body"; })) === null || _b === void 0 ? void 0 : _b.children.slice(1, -1)) || [];
            templates.push({ identifier: identifier, body: body, closed: isClosed(body) });
            return _1.idTransform(node, children);
        },
        default: _1.idTransform,
    };
    transform_1.default(program, findTemplatesTransform);
    return templates;
}
exports.default = getTemplates;
