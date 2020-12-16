import { Transform } from "../transform";

export const idTransform: Transform<any, any> = (node, children) => ({ ...node, children: children.flat() });

export function replace<T>(elements: T[], replaceWith : T, check : (el : T) => boolean) : T[] {
    return elements.map(el => check(el) ? replaceWith : el);
}
