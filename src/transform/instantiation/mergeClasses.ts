import {ScopedVariableAST} from "./scope/transformVariableRefs";

function mergeClassesInTemplate(templateBody: ScopedVariableAST) {

}

export default function mergeClasses(program: ScopedVariableAST) {
    const templateBodies = program.children.filter((el) => el.type === 'package_template_body');
    console.log(templateBodies);
}