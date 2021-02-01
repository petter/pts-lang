import { NodeTransform } from '../transform';

export const idTransform: NodeTransform<any, any> = (node, children) => ({ ...node, children: children.flat() });

export function replace<T>(elements: T[], replaceWith: T, check: (el: T) => boolean): T[] {
    return elements.map((el) => (check(el) ? replaceWith : el));
}

export const typeIs = (type: string) => (objectWithType: { type: string }) => objectWithType.type === type;
export const identifierIs = (identifier: string) => (objectWithIdentifier: { identifier: string }) =>
    objectWithIdentifier.identifier === identifier;
