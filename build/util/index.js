"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifierIs = exports.typeIs = exports.replace = exports.idTransform = void 0;
const idTransform = (node, children) => ({ ...node, children: children.flat() });
exports.idTransform = idTransform;
function replace(elements, replaceWith, check) {
    return elements.map((el) => (check(el) ? replaceWith : el));
}
exports.replace = replace;
const typeIs = (type) => (objectWithType) => objectWithType.type === type;
exports.typeIs = typeIs;
const identifierIs = (identifier) => (objectWithIdentifier) => objectWithIdentifier.identifier === identifier;
exports.identifierIs = identifierIs;
