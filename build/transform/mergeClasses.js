'use strict';
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                  enumerable: true,
                  get: function () {
                      return m[k];
                  },
              });
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v });
          }
        : function (o, v) {
              o['default'] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
var __spreadArrays =
    (this && this.__spreadArrays) ||
    function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
        return r;
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
var index_1 = __importStar(require('./index'));
var util_1 = require('../util');
var lodash_1 = __importDefault(require('lodash'));
var classDeclId = function (cld) {
    return cld.children.find(function (el) {
        return el.type === 'type_identifier';
    }).text;
};
function mergeClasses(program) {
    return index_1.default(program, {
        package_template_body: function (node, children) {
            var classes = children.filter(function (c) {
                return c.type === 'class_declaration';
            });
            // TODO: Check if two classes can be merged (have different heritage?)
            var classGroups = lodash_1.default.groupBy(classes, classDeclId);
            var mergedClasses = mergeClassGroups(classGroups);
            return util_1.idTransform(node, replaceClassDeclsWithMergedClasses(children, mergedClasses));
        },
        default: util_1.idTransform,
    });
}
exports.default = mergeClasses;
function mergeClassGroups(classGroups) {
    return Object.values(classGroups).map(mergeClassesInGroups);
}
function mergeClassesInGroups(classGroup) {
    var bodies = classGroup.map(function (n) {
        return n.children
            .filter(function (el) {
                return el.type === 'class_body';
            })
            .flatMap(function (el) {
                return el.children;
            });
    });
    var mergedBodies = __spreadArrays(
        [bodies[0][0]],
        bodies.reduce(function (prev, cur) {
            return prev.concat(cur.slice(1, -1));
        }, []),
        [bodies[0][bodies[0].length - 1]],
    );
    var resultClass = classGroup[0];
    resultClass.children.find(function (el) {
        return el.type === 'class_body';
    }).children = mergedBodies;
    return resultClass;
}
function replaceClassDeclsWithMergedClasses(body, mergedClasses) {
    var hasVisited = [];
    return index_1.default(body, {
        class_declaration: function (node, children) {
            var id = classDeclId(node);
            if (hasVisited.includes(id)) {
                return index_1.EMPTY_NODE;
            }
            hasVisited.push(id);
            var mergedClass = mergedClasses.find(function (el) {
                return classDeclId(el) === id;
            });
            if (mergedClass === undefined) {
                return util_1.idTransform(node, children);
            }
            return mergedClass;
        },
        default: util_1.idTransform,
    });
}
