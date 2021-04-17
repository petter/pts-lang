"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../util");
class Attribute {
    constructor(name, node) {
        this.references = [];
        this.rename = (newName) => {
            this.name = newName;
        };
        // toAST: transform children toAST
        this.toAST = () => {
            return util_1.traverse(this.node, {
                prefix: (el) => ('toAST' in el ? el.toAST() : el),
            });
        };
        this.name = name;
        this.node = node;
    }
    static fromDeclaration(attributeDeclaration) {
        const { name, node } = parseDefinition(attributeDeclaration);
        const attr = new Attribute(name, node);
        // TODO: Traverse node and transform all references
        // traverse(node, {prefix: (el: TreeNode) => el.})
        return attr;
    }
}
exports.default = Attribute;
function parseDefinition(definition) {
    if (definition.type === 'public_field_definition') {
        return parsePublicFieldDefinition(definition);
    }
    else if (definition.type === 'method_definition') {
        return parseMethodDefinition(definition);
    }
    else {
        throw new Error('Unsupported attribute type: ' + definition.type);
    }
}
function parsePublicFieldDefinition(publicFieldDefinition) {
    const name = publicFieldDefinition.children.find(util_1.typeIs('property_identifier'))?.text;
    if (name === undefined)
        throw new Error('Impossible state! public field definition has no property identifier');
    return { name: name, node: publicFieldDefinition };
}
function parseMethodDefinition(methodDefinition) {
    try {
        return parsePublicFieldDefinition(methodDefinition);
    }
    catch (error) {
        throw new Error('Impossible state! Method definition has no property identifier');
    }
}
