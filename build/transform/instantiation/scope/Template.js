"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../util");
class Template {
    constructor(name, body, program) {
        this.name = name;
        this.body = body;
        this.program = program;
    }
    static fromDeclaration(packageTemplateDeclaration) {
        if (packageTemplateDeclaration.type !== 'package_declaration' &&
            packageTemplateDeclaration.type !== 'template_declaration') {
            throw new Error('Cannot create a template from a ' + packageTemplateDeclaration.type);
        }
        const templateName = packageTemplateDeclaration.children.find(util_1.typeIs('identifier'))?.text;
        if (templateName === undefined)
            throw new Error('Impossible state! Template has no name.');
        const ptBody = packageTemplateDeclaration.children.find(util_1.typeIs('package_template_body'))?.children.slice(1, -1);
        if (ptBody === undefined)
            throw new Error('Impossible state! Template has no body.');
        const body = parsePTBody(ptBody);
        return new Template(templateName, body);
    }
}
exports.default = Template;
function parsePTBody(ptBody) {
    if ()
        ;
}
