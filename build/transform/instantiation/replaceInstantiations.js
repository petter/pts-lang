"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = __importDefault(require("../index"));
var util_1 = require("../../util");
var getTemplates_1 = __importDefault(require("../../util/getTemplates"));
var rename_1 = __importDefault(require("./rename"));
var mergeClasses_1 = __importDefault(require("../mergeClasses"));
function replaceInstantiations(program, _templates) {
    var templates = _templates || getTemplates_1.default(program);
    var replaceInstTransformer = makeReplaceInstTransformer(templates);
    return transformInst(program, replaceInstTransformer);
}
exports.default = replaceInstantiations;
var makeReplaceInstTransformer = function (templates) { return function (instNode, instChildren) {
    var ast = __assign(__assign({}, instNode), { children: instChildren });
    var instReplacedAst = index_1.default(ast, {
        inst_statement: function (node, children) {
            return instTransformer(node, children, templates);
        },
        default: util_1.idTransform,
    });
    return mergeClasses_1.default(instReplacedAst);
}; };
var transformInst = function (node, replaceInstTransformer) { return index_1.default(node, {
    template_declaration: replaceInstTransformer,
    package_declaration: replaceInstTransformer,
    default: util_1.idTransform,
}); };
var instTransformer = function (_, children, templates) {
    var _a, _b;
    var instId = ((_a = children.find(util_1.typeIs('identifier'))) === null || _a === void 0 ? void 0 : _a.text) || "";
    var renamings = ((_b = children
        .find(util_1.typeIs("class_renamings"))) === null || _b === void 0 ? void 0 : _b.children.filter(util_1.typeIs('class_rename')).map(extractRenamings)) || [];
    var template = templates.find(util_1.identifierIs(instId));
    if (template === undefined) {
        throw new Error("Instantiating undefined template: " + instId);
    }
    var templateBody = template.body;
    if (!template.isClosed) {
        templateBody = replaceInstantiations({ children: template.body, type: 'temp', text: '' }, templates).children;
    }
    return rename_1.default(renamings, template.body);
};
function extractRenamings(classRenameNode) {
    var _a;
    var classRenaming = classRenameNode.children[0];
    var fieldRenamings = (_a = classRenameNode.children
        .find(util_1.typeIs('field_renamings'))) === null || _a === void 0 ? void 0 : _a.children.filter(util_1.typeIs('rename')).map(makeRenameObject);
    return __assign(__assign({}, makeRenameObject(classRenaming)), { fields: fieldRenamings || [] });
}
var RENAMING_OLD = 0;
var RENAMING_NEW = 2;
var makeRenameObject = function (renamingNode) { return ({
    old: renamingNode.children[RENAMING_OLD].text,
    new: renamingNode.children[RENAMING_NEW].text
}); };
