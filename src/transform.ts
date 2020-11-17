import { ASTNode } from "./AST";

type BaseInput = { type: string; children: BaseInput[] };
export type Transform<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
> = (inp: Omit<InputNode, "children">, children: OutputNode[]) => OutputNode;
export interface Transformer<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
> {
  [key: string]: Transform<InputNode, OutputNode>;
  default: Transform<InputNode, OutputNode>;
}

export default function transform<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
>(
  { children, ...node }: ASTNode,
  transformer: Transformer<InputNode, OutputNode>
) {
  const transformedChildren: OutputNode[] = children.map((child) =>
    transform(child, transformer)
  );

  const transformFunc = transformer[node.type] || transformer.default;
  return transformFunc(
    ({ ...node } as unknown) as Omit<InputNode, "children">,
    transformedChildren
  );
}
