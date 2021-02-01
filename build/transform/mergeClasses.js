"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importStar(require("./index"));
const util_1 = require("../util");
const lodash_1 = __importDefault(require("lodash"));
const classDeclId = (cld) => cld.children.find(util_1.typeIs('type_identifier')).text;
function mergeClasses(program) {
    return index_1.default(program, {
        package_template_body: (node, children) => {
            const classes = children.filter((c) => c.type === 'class_declaration');
            // TODO: Check if two classes can be merged (have different heritage?)
            const classGroups = lodash_1.default.groupBy(classes, classDeclId);
            const mergedClasses = mergeClassGroups(classGroups);
            return util_1.idTransform(node, replaceClassDeclsWithMergedClasses(children, mergedClasses));
        },
        default: util_1.idTransform,
    });
}
exports.default = mergeClasses;
function mergeClassGroups(classGroups) {
    return Object.values(classGroups).map(mergeClassesInGroups);
}
const dab = 1;
function mergeClassesInGroups(classGroup) {
    const bodies = classGroup.map((n) => n.children.filter((el) => el.type === 'class_body').flatMap((el) => el.children));
    const mergedBodies = [
        bodies[0][0],
        ...bodies.reduce((prev, cur) => prev.concat(cur.slice(1, -1)), []),
        bodies[0][bodies[0].length - 1],
    ];
    const resultClass = classGroup[0];
    resultClass.children.find((el) => el.type === 'class_body').children = mergedBodies;
    return resultClass;
}
function replaceClassDeclsWithMergedClasses(body, mergedClasses) {
    const hasVisited = [];
    return index_1.default(body, {
        class_declaration: (node, children) => {
            const id = classDeclId(node);
            if (hasVisited.includes(id)) {
                return index_1.EMPTY_NODE;
            }
            hasVisited.push(id);
            const mergedClass = mergedClasses.find((el) => classDeclId(el) === id);
            if (mergedClass === undefined) {
                return util_1.idTransform(node, children);
            }
            return mergedClass;
        },
        default: util_1.idTransform,
    });
}
