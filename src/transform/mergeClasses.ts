import {ScopedVariableAST, VarNode} from "./instantiation/scope/transformVariableRefs";

export default function mergeClasses(body: ScopedVariableAST[]) : ScopedVariableAST[] {
    const classes = body.filter(el => el.type === 'class_declaration');
    const classesWithVars = classes.map(el => [el, (el.children.find(c => c.type === 'variable') as VarNode).var]);
    console.log(classesWithVars)
    return body;
}