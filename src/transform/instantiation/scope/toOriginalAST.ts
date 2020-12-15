import transform from "../../index";
import { ASTNode } from "../../../AST";
import { ScopedVariableAST } from "./transformVariableRefs";
import Variable from "./Variable";

export default function toOriginalAST(program: ScopedVariableAST | ScopedVariableAST[]) : ASTNode | ASTNode[] {
    if(Array.isArray(program)) {
       return program.map(toOriginalAST) as ASTNode[];
    }

    return transform<ScopedVariableAST, ASTNode>(program, {
        variable: (node : any, children) => ({
            type: node.origType,
            text: (node.var as Variable).toString(),
            children
        }),
        default: (node : any, children) => ({
            type: node.type,
            text: node.text,
            children
        })
    }) as ASTNode;
}