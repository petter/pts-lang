import { Transform } from "../transform";

export const idTransform: Transform<any, any> = (node, children) => ({ ...node, children: children.flat() });
