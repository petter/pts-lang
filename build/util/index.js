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
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifierIs = exports.typeIs = exports.replace = exports.idTransform = void 0;
var idTransform = function (node, children) { return (__assign(__assign({}, node), { children: children.flat() })); };
exports.idTransform = idTransform;
function replace(elements, replaceWith, check) {
    return elements.map(function (el) { return check(el) ? replaceWith : el; });
}
exports.replace = replace;
var typeIs = function (type) { return function (objectWithType) { return objectWithType.type === type; }; };
exports.typeIs = typeIs;
var identifierIs = function (identifier) { return function (objectWithIdentifier) { return objectWithIdentifier.identifier === identifier; }; };
exports.identifierIs = identifierIs;
