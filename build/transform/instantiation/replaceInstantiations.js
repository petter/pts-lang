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
function replaceInstantiations(program) {
    var templates = getTemplates_1.default(program);
    var replaceInst = function (instNode, instChildren) {
        var res = __assign(__assign({}, instNode), { children: instChildren });
        var inst = false;
        do {
            inst = false;
            res = index_1.default(res, {
                inst_statement: function (node, children) {
                    inst = true;
                    return instTransformer(node, children, templates);
                },
                default: util_1.idTransform,
            });
            res = mergeClasses_1.default(res);
        } while (inst);
        return res;
    };
    return index_1.default(program, {
        template_declaration: replaceInst,
        package_declaration: replaceInst,
        default: util_1.idTransform,
    });
}
exports.default = replaceInstantiations;
var instTransformer = function (_, children, templates) {
    var _a, _b;
    var instId = ((_a = children.find(function (child) { return child.type === "identifier"; })) === null || _a === void 0 ? void 0 : _a.text) || "";
    var renamings = ((_b = children
        .find(function (el) { return el.type === "class_renamings"; })) === null || _b === void 0 ? void 0 : _b.children.filter(function (child) { return child.type === "class_rename"; }).map(function (el) {
        var _a;
        var classRenaming = el.children[0];
        var fieldRenamings = (_a = el.children
            .find(function (maybeFields) { return maybeFields.type === "field_renamings"; })) === null || _a === void 0 ? void 0 : _a.children.filter(function (maybeRename) { return maybeRename.type === "rename"; }).map(function (renaming) { return ({
            old: renaming.children[0].text,
            new: renaming.children[2].text,
        }); });
        return {
            old: classRenaming.children[0].text,
            new: classRenaming.children[2].text,
            fields: fieldRenamings || [],
        };
    })) || [];
    var template = templates.find(function (t) { return t.identifier === instId; });
    if (template === undefined) {
        throw new Error("Instantiating undefined template, " + instId);
    }
    return rename_1.default(renamings, template.body);
};
