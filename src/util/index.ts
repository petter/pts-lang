import { Transform } from "../transform";

export const idTransform: Transform = (node, children) => ({ ...node, children });
