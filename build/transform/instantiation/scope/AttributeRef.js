"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AttributeRef {
    constructor(attribute, type, scope) {
        this.children = [];
        this.toAST = () => ({
            type: this.type,
            text: this.attribute.name,
            scope: this.scope,
            children: [],
        });
        this.attribute = attribute;
        this.type = type;
        this.scope = scope;
    }
}
exports.default = AttributeRef;
