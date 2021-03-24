import { traverse, typeIs } from '../../../util';
import { ScopedAST } from './ASTScoper';
import ASTTransformable from './ASTTransformable';
import AttributeRef from './AttributeRef';

export default class Attribute implements ASTTransformable {
    name: string;
    node: ScopedAST;
    references: AttributeRef[] = [];

    private constructor(name: string, node: ScopedAST) {
        this.name = name;
        this.node = node;
    }

    public static fromDeclaration(attributeDeclaration: ScopedAST): Attribute {
        const { name, node } = parseDefinition(attributeDeclaration);
        return new Attribute(name, node);
    }

    rename = (newName: string) => {
        this.name = newName;
    };

    // toAST: transform children toAST
    toAST: () => ScopedAST = () => {
        return traverse(this.node, {
            prefix: (el: ScopedAST | AttributeRef) => ('toAST' in el ? el.toAST() : el),
        });
    };
}

type ParsedDefinition = { name: string; node: ScopedAST };

function parseDefinition(definition: ScopedAST): ParsedDefinition {
    if (definition.type === 'public_field_definition') {
        return parsePublicFieldDefinition(definition);
    } else if (definition.type === 'method_definition') {
        return parseMethodDefinition(definition);
    } else {
        throw new Error('Unsupported attribute type: ' + definition.type);
    }
}

function parsePublicFieldDefinition(publicFieldDefinition: ScopedAST): ParsedDefinition {
    const name = publicFieldDefinition.children.find(typeIs('property_identifier'))?.text;
    if (name === undefined) throw new Error('Impossible state! public field definition has no property identifier');
    return { name: name, node: publicFieldDefinition };
}

function parseMethodDefinition(methodDefinition: ScopedAST): ParsedDefinition {
    try {
        return parsePublicFieldDefinition(methodDefinition);
    } catch (error) {
        throw new Error('Impossible state! Method definition has no property identifier');
    }
}
