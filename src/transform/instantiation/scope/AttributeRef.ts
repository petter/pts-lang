import { ScopedAST } from './ASTScoper';
import ASTTransformable from './ASTTransformable';
import Attribute from './Attribute';
import Scope from './Scope';

export default class AttributeRef implements ASTTransformable {
    attribute: Attribute;
    type: string;
    scope: Scope;
    children = [];

    constructor(attribute: Attribute, type: string, scope: Scope) {
        this.attribute = attribute;
        this.type = type;
        this.scope = scope;
    }

    toAST: () => ScopedAST = () => ({
        type: this.type,
        text: this.attribute.name,
        scope: this.scope,
        children: [],
    });
}
