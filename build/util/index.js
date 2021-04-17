"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverse = exports.joinArrays = exports.filterMap = exports.filterNull = exports.isNotNull = exports.identifierIs = exports.typeIs = exports.replace = exports.idTransform = void 0;
const idTransform = (node, children) => ({ ...node, children: children.flat() });
exports.idTransform = idTransform;
function replace(elements, replaceWith, check) {
    return elements.map((el) => (check(el) ? replaceWith : el));
}
exports.replace = replace;
const typeIs = (type) => (objectWithType) => {
    if (Array.isArray(type))
        return type.some((el) => objectWithType.type === el);
    return objectWithType.type === type;
};
exports.typeIs = typeIs;
const identifierIs = (identifier) => (objectWithIdentifier) => objectWithIdentifier.identifier === identifier;
exports.identifierIs = identifierIs;
function isNotNull(something) {
    return something !== null;
}
exports.isNotNull = isNotNull;
function filterNull(elements) {
    return elements.filter(isNotNull);
}
exports.filterNull = filterNull;
function filterMap(elements, func) {
    const mappedElements = elements.map(func);
    return filterNull(mappedElements);
}
exports.filterMap = filterMap;
function joinArrays(a, b) {
    return [...a, ...b];
}
exports.joinArrays = joinArrays;
function traverse(tree, { prefix, postfix }) {
    const prefixAppliedTree = prefix ? prefix(tree) : tree;
    prefixAppliedTree.children = prefixAppliedTree.children.map((child) => traverse(child, { prefix, postfix }));
    return postfix ? postfix(tree) : tree;
}
exports.traverse = traverse;
