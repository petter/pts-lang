type BaseInput = { type: string; children: BaseInput[] };
export type NodeTransform<InputNode extends BaseInput, OutputNode> = (
    inp: InputNode,
    children: OutputNode[],
) => OutputNode | OutputNode[];
export interface Transformer<InputNode extends BaseInput, OutputNode> {
    [key: string]: NodeTransform<InputNode, OutputNode>;
    default: NodeTransform<InputNode, OutputNode>;
}
export type Revisit<InputNode extends BaseInput, OutputNode> = (
    input: InputNode | InputNode[],
) => OutputNode | OutputNode[];

export default function transform<InputNode extends BaseInput, OutputNode>(
    node: InputNode | InputNode[],
    transformer:
        | Transformer<InputNode, OutputNode>
        | ((revisit: Revisit<InputNode, OutputNode>) => Transformer<InputNode, OutputNode>),
): OutputNode | OutputNode[] {
    if (Array.isArray(node)) {
        return node.map((inp) => transform(inp, transformer)) as OutputNode[];
    }

    const transformerObj =
        typeof transformer === 'object' ? transformer : transformer((inp) => transform(inp, transformer));

    const transformedChildren: OutputNode[] = [
        transform(node.children as InputNode[], transformer),
    ].flat() as OutputNode[];
    const transformFunc = transformerObj[node.type] || transformerObj.default;
    return transformFunc({ ...node }, transformedChildren);
}

export const EMPTY_NODE = [];
