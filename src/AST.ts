import Parser from "tree-sitter";

export interface ASTNode {
  type: string;
  text: string;
  children: ASTNode[];
  
}

export function toAST(tree: Parser.Tree): ASTNode {
  const cursor = tree.walk();
  function visitNode(): ASTNode {
    return {
      type: cursor.nodeType,
      text: cursor.nodeText,
      children: visitChildren(),
    };
  }

  function visitChildren(): ASTNode[] {
    const children: ASTNode[] = [];

    if (!cursor.gotoFirstChild()) return children;

    do {
      children.push(visitNode());
    } while (cursor.gotoNextSibling());
    cursor.gotoParent();
    return children;
  }

  return visitNode();
}
