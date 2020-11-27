import { ASTNode } from "../AST";
import transform from "../transform";

export default function toTS(program: ASTNode) {
    return transform<ASTNode, string>(program, {
        template_declaration: () => "",
        package_declaration: (node, children) => {
            return transform(children, {
                package_template_body: (_, body) =>   
            })
        }
        default: (node, children) => {
            if(children.length === 0) {
                return node.text
            } else {
                return children.join(' ')
            }
        }
    }) as string
}