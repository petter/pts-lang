"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_kinds_1 = require("../../../token-kinds");
const util_1 = require("../../../util");
class Attribute {
    constructor(name, node) {
        this.references = [];
        this.initialized = 0;
        this.transformRefs = () => {
            // TODO: Traverse node and transform all references
            // traverse(node, {prefix: (el: TreeNode) => el.})
            this.initialized++;
        };
        this.failIfNotInitialized = () => {
            if (this.initialized === 2) {
                throw new Error("Illegal use of class. Can't use Attribute-class before refs have been transformed and member class has been set. Call transformRefs and memberOf first.");
            }
        };
        this.rename = (newName) => {
            this.failIfNotInitialized();
            const newAttr = this.clone();
            newAttr.name = newName;
            return newAttr;
        };
        this.clone = () => ({ ...this });
        // toAST: transform children toAST
        this.toAST = () => {
            this.failIfNotInitialized();
            return util_1.traverse(this.node, {
                prefix: (el) => ('toAST' in el ? el.toAST() : el),
            });
        };
        this.name = name;
        this.node = node;
    }
    get memberOf() {
        this.failIfNotInitialized();
        if (this.memberValue === undefined) {
            throw new Error('Class has somehow been initialized but memberOf value is still undefined. Something has gone wrong.');
        }
        return this.memberValue;
    }
    set memberOf(memberOf) {
        this.memberValue = memberOf;
        this.initialized++;
    }
    static fromDeclaration(attributeDeclaration) {
        const maybeParsedDef = parseDefinition(attributeDeclaration);
        if (maybeParsedDef !== undefined)
            return new Attribute(maybeParsedDef.name, maybeParsedDef.node);
        return undefined;
    }
}
exports.default = Attribute;
function parseDefinition(definition) {
    if (definition.type === token_kinds_1.PUBLIC_FIELD_DEFINITION) {
        return parsePublicFieldDefinition(definition);
    }
    else if (definition.type === token_kinds_1.METHOD_DEFINITION) {
        return parseMethodDefinition(definition);
    }
    else if (definition.type === token_kinds_1.SEMI) {
        return undefined;
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
