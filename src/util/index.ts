import { NodeTransform } from '../transform';

export const idTransform: NodeTransform<any, any> = (node, children) => ({ ...node, children: children.flat() });

export function replace<T>(elements: T[], replaceWith: T, check: (el: T) => boolean): T[] {
    return elements.map((el) => (check(el) ? replaceWith : el));
}

export const typeIs = (type: string | string[]) => (objectWithType: { type: string }) => {
    if (Array.isArray(type)) return type.some((el) => objectWithType.type === el);
    return objectWithType.type === type;
};
export const identifierIs = (identifier: string) => (objectWithIdentifier: { identifier: string }) =>
    objectWithIdentifier.identifier === identifier;

export function isNotNull<T>(something: T | null): something is T {
    return something !== null;
}
export function filterNull<T>(elements: (T | null)[]): T[] {
    return elements.filter(isNotNull);
}
export function filterMap<T>(elements: T[], func: (el: T) => T | null) {
    const mappedElements = elements.map(func);
    return filterNull(mappedElements);
}

export function joinArrays<T>(a: T[], b: T[]): T[] {
    return [...a, ...b];
}

export function traverse<T extends { children: T[] }>(
    tree: T,
    { prefix, postfix }: { prefix?: (t: T) => T; postfix?: (t: T) => T },
) {
    const prefixAppliedTree = prefix ? prefix(tree) : tree;
    prefixAppliedTree.children = prefixAppliedTree.children.map((child) => traverse(child, { prefix, postfix }));
    return postfix ? postfix(tree) : tree;
}
