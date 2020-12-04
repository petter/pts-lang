import { ASTNode } from "../AST";

type BaseInput = { type: string; children: BaseInput[] };
export type Transform<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
> = (inp: Omit<InputNode, "children">, children: OutputNode[]) => OutputNode | OutputNode[];
export interface Transformer<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
> {
  [key: string]: Transform<InputNode, OutputNode>;
  default: Transform<InputNode, OutputNode>;
}
export type Revisit<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
 > = (input : InputNode | InputNode[]) => OutputNode | OutputNode[];

export default function transform<
  InputNode extends BaseInput = ASTNode,
  OutputNode = ASTNode
>(
  input: InputNode | InputNode[],
  transformer: Transformer<InputNode, OutputNode> | ((revisit : Revisit<InputNode, OutputNode>) => Transformer<InputNode, OutputNode>)
) : OutputNode | OutputNode[] {
  if(Array.isArray(input)) {
    return input.map(inp => transform(inp, transformer)) as OutputNode[]
  }

  const untouchedChildren = [...input.children];
  const {children, ...node} = input
  const transformerObj = typeof transformer === 'object' ? transformer : transformer(inp => transform(inp, transformer));

  
  const transformedChildren: OutputNode[] = [transform(children as InputNode[], transformer)].flat() as OutputNode[];
  const transformFunc = transformerObj[node.type] || transformerObj.default;
  return transformFunc(
    { ...node },
    transformedChildren
  );
}
