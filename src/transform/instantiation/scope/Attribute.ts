import { METHOD_DEFINITION, PUBLIC_FIELD_DEFINITION, SEMI } from '../../../token-kinds';
import { traverse, typeIs } from '../../../util';
import { ScopedAST } from './ASTScoper';
import ASTTransformable from './ASTTransformable';
import AttributeRef from './AttributeRef';
import Class from './Class';

type TreeNode = ScopedAST | AttributeRef;

export default class Attribute implements ASTTransformable {
    name: string;
    node: ScopedAST;

    private memberValue: Class | undefined;
    get memberOf() {
        this.failIfNotInitialized();
        if (this.memberValue === undefined) {
            throw new Error(
                'Class has somehow been initialized but memberOf value is still undefined. Something has gone wrong.',
            );
        }
        return this.memberValue;
    }
    set memberOf(memberOf) {
        this.memberValue = memberOf;
        this.initialized++;
    }

    references: AttributeRef[] = [];
    initialized = 0;

    private constructor(name: string, node: ScopedAST) {
        this.name = name;
        this.node = node;
    }

    public static fromDeclaration(attributeDeclaration: ScopedAST): Attribute | undefined {
        const maybeParsedDef = parseDefinition(attributeDeclaration);
        if (maybeParsedDef !== undefined) return new Attribute(maybeParsedDef.name, maybeParsedDef.node);
        return undefined;
    }

    public transformRefs = () => {
        // TODO: Traverse node and transform all references
        // traverse(node, {prefix: (el: TreeNode) => el.})
        this.initialized++;
    };

    private failIfNotInitialized = () => {
        if (this.initialized === 2) {
            throw new Error(
                "Illegal use of class. Can't use Attribute-class before refs have been transformed and member class has been set. Call transformRefs and memberOf first.",
            );
        }
    };

    rename = (newName: string): Attribute => {
        this.failIfNotInitialized();
        const newAttr = this.clone();
        newAttr.name = newName;
        return newAttr;
    };

    public clone = (): Attribute => ({ ...this });

    // toAST: transform children toAST
    toAST: () => ScopedAST = () => {
        this.failIfNotInitialized();
        return traverse(this.node, {
            prefix: (el: TreeNode) => ('toAST' in el ? el.toAST() : el),
        });
    };
}

type ParsedDefinition = { name: string; node: ScopedAST };

function parseDefinition(definition: ScopedAST): ParsedDefinition | undefined {
    if (definition.type === PUBLIC_FIELD_DEFINITION) {
        return parsePublicFieldDefinition(definition);
    } else if (definition.type === METHOD_DEFINITION) {
        return parseMethodDefinition(definition);
    } else if (definition.type === SEMI) {
        return undefined;
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
