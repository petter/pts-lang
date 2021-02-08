import { NodeTransform } from '../transform';

export const idTransform: NodeTransform<any, any> = (node, children) => ({ ...node, children: children.flat() });

export function replace<T>(elements: T[], replaceWith: T, check: (el: T) => boolean): T[] {
    return elements.map((el) => (check(el) ? replaceWith : el));
}

export const typeIs = (type: string) => (objectWithType: { type: string }) => objectWithType.type === type;
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
