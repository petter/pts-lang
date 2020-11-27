import { ASTNode } from "../AST";
import transform from "../transform";

export default function prettyPrint(program: ASTNode) {
    return transform<ASTNode, string>(program, {
        default: (node, children) => {
            if(children.length === 0) {
                return node.text
            } else {
                return children.join(' ')
            }
        }
    }) as string
}