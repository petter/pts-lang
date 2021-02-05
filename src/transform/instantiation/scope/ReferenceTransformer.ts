import transform from '../../index';
import { idTransform, replace, typeIs } from '../../../util';
import Scope from './Scope';
import { ScopedAST } from './ASTScoper';
import Variable from './Variable';
import Class from './Class';

const MEMBER_OF = 0;
const MEMBER = 2;

export class RefNode {
    type = 'variable';
    text = '';
    children: ScopedRefNode[] = [];

    origType: string;
    ref: Variable;
    scope: Scope;

    constructor({ origType, ref, scope }: { origType: string; ref: Variable; scope: Scope }) {
        this.origType = origType;
        this.ref = ref;
        this.scope = scope;
    }
}

export interface ScopedRefASTNonRefNode extends ScopedAST {
    children: ScopedRefNode[];
}

export type ScopedRefNode = ScopedRefASTNonRefNode | RefNode;

/**
 * Travels the tree to register declarations, and then transforms the nodes that reference a class or a class field to
 * a @RefNode.
 */
export default class ReferenceTransformer {
    private program: ScopedRefNode;

    private constructor(program: ScopedAST) {
        this.program = program;
    }

    public static transform = (program: ScopedAST): ScopedRefNode => {
        const referenceTransformer = new ReferenceTransformer(program);
        referenceTransformer.registerDeclarations();
        referenceTransformer.registerReferences();
        return referenceTransformer.program;
    };

    private applyToNodesOfType = (typeFuncMap: { [key: string]: (node: ScopedRefNode) => ScopedRefNode }) => {
        function applyToNodesOfTypeRecurse(node: ScopedRefNode): ScopedRefNode {
            let newNode = node;
            if (node.type in typeFuncMap) {
                newNode = typeFuncMap[node.type](node);
            }

            const newChildren = newNode.children.map(applyToNodesOfTypeRecurse);
            return { ...newNode, children: newChildren };
        }

        this.program = applyToNodesOfTypeRecurse(this.program);
    };

    private registerDeclarations = () => {
        this.registerAllClassDeclarations();
        this.registerClassHeritages();
        this.registerClassFieldDeclarations();
    };

    private registerAllClassDeclarations = () => {
        this.applyToNodesOfType({ class_declaration: this.registerClassDeclaration });
    };

    private registerClassDeclaration = (node: ScopedAST): ScopedRefNode => {
        const classNameIndex = node.children.findIndex(typeIs('type_identifier'));
        const classNameNode = node.children[classNameIndex];
        const className = classNameNode.text;
        const classScope = node.children.find(typeIs('class_body'))!.scope;
        const classDecl = node.scope.defineClass(className, classScope);

        const classRefNode = new RefNode({ origType: classNameNode.type, ref: classDecl, scope: node.scope });
        const newChildren = [...node.children];
        newChildren[classNameIndex] = classRefNode;

        return { ...node, children: newChildren };
    };

    private registerClassHeritages = () => {
        this.applyToNodesOfType({ class_declaration: this.registerClassHeritage });
    };

    private registerClassHeritage = (node: ScopedRefNode): ScopedRefNode => {
        const EXTENDS_CLAUSE = 0;
        let hasExtends = false;
        const heritageIndex = node.children.findIndex(typeIs('class_heritage'));

        if (heritageIndex === -1) return node;

        const subClassRef = node.children.find(typeIs('variable')) as RefNode;
        const heritageNode = { ...node.children[heritageIndex], children: [...node.children[heritageIndex].children] };
        const { extendsClause, implementsClause } = getHeritageNodes(heritageNode);

        if (extendsClause !== undefined) {
            hasExtends = true;
            // TypeScript grammar allows for several superclasses, so we will treat it as allowed as well.
            // TODO: Also allow it in Class-class
            const newExtendsClauseChildren = [...extendsClause.children].map((child) => {
                if (child.type === 'extends' || child.type === ',') return child;
                if (child.type === 'type_identifier') return this.transformTypeIdentifier(child);
                if (child.type === 'generic_type') return this.transformGenericTypeIdentifier(child);
                throw new Error(child.type + ' is not a supported superclass');
            });

            heritageNode.children[EXTENDS_CLAUSE] = { ...extendsClause, children: newExtendsClauseChildren };

            const firstSuperClass = newExtendsClauseChildren[1];
            let firstRefNode: RefNode;
            if (firstSuperClass instanceof RefNode) {
                firstRefNode = firstSuperClass;
            } else {
                // generic_type
                firstRefNode = firstSuperClass.children[0] as RefNode;
            }

            // TODO: Do something like this for interfaces as well
            if (subClassRef !== undefined) {
                (subClassRef.ref as Class).addSuperClass(firstRefNode.ref as Class);
            } else {
                throw new Error("Can't find subclass" + node.children);
            }
        }

        if (implementsClause !== undefined) {
            const newImplementsClauseChildren = [...implementsClause.children].map((child) => {
                if (child.type === 'implements' || child.type === ',') return child;
                if (child.type === 'type_identifier') return this.transformTypeIdentifier(child);
                if (child.type === 'generic_type') return this.transformGenericTypeIdentifier(child);
                throw new Error(child.type + ' is not a supported implementing interface');
            });
            heritageNode.children[EXTENDS_CLAUSE + (hasExtends ? 1 : 0)] = {
                ...implementsClause,
                children: newImplementsClauseChildren,
            };
        }

        const newChildren = [...node.children];
        newChildren[heritageIndex] = heritageNode;
        return { ...node, children: newChildren };
    };

    private transformTypeIdentifier = (typeIdentifierNode: ScopedRefNode): ScopedRefNode => {
        const classRef = typeIdentifierNode.scope.lookupClass(typeIdentifierNode.text);
        if (classRef === undefined) return typeIdentifierNode;
        return new RefNode({ origType: typeIdentifierNode.type, scope: typeIdentifierNode.scope, ref: classRef });
    };

    private transformGenericTypeIdentifier = (genericTypeNode: Readonly<ScopedRefNode>): ScopedRefNode => {
        const newGenericTypeNode = { ...genericTypeNode, children: [...genericTypeNode.children] };

        const genericTargetNode = genericTypeNode.children[0];
        if (genericTargetNode.type !== 'type_identifier') {
            // TODO: Support it
            throw new Error('Nested type identifier are not supported');
        }
        const genericTargetRefNode = this.transformTypeIdentifier(genericTargetNode);
        newGenericTypeNode.children[0] = genericTargetRefNode;

        const newTypeArguments = {
            ...genericTypeNode.children[1],
            children: [...genericTypeNode.children[1].children],
        };
        newTypeArguments.children = newTypeArguments.children.map((child) => {
            const ignoredNodes = ['<', '>', ','];
            if (ignoredNodes.includes(child.type)) return child;
            if (child.type === 'type_identifier') return this.transformTypeIdentifier(child);
            if (child.type === 'generic_type') return this.transformGenericTypeIdentifier(child);
            throw new Error(child.type + ' is not a supported generic type');
        });

        return newGenericTypeNode;
    };

    private registerClassFieldDeclarations = () => {
        this.applyToNodesOfType({ public_field_definition: this.registerPublicFieldDefinition });
    };

    private registerPublicFieldDefinition = (node: ScopedAST): ScopedRefNode => {
        const idNodeIndex = node.children.findIndex(typeIs('property_identifier'));
        const idNode = node.children[idNodeIndex];
        const newExprNode = node.children.find(typeIs('new_expression'));

        // TODO: Hva med generics? new A<B>(); Kanskje nok med en pass over type_identifiers?
        const instanceOf = newExprNode?.children.find(typeIs('identifier'))?.text;

        const fieldRef = idNode.scope.defineVariable(idNode.text, instanceOf);
        const fieldDefinitionRef = new RefNode({
            origType: idNode.type,
            ref: fieldRef,
            scope: node.scope,
        });

        const newChildren = [...node.children];
        newChildren[idNodeIndex] = fieldDefinitionRef;

        return { ...node, children: newChildren };
    };

    private registerReferences = () => {
        this.applyToNodesOfType({
            this: this.transformThis,
        });
        this.applyToNodesOfType({
            new_expression: this.registerNewExpression,
            member_expression: this.registerMemberExpression,
        });
    };

    // TODO: Support type expressions
    private registerNewExpression = (newExprNode: Readonly<ScopedRefNode>): ScopedRefNode => {
        const idIndex = newExprNode.children.findIndex((c) => c.type === 'identifier');
        const idNode = newExprNode.children[idIndex];
        const decl = idNode.scope.lookup(idNode.text);

        if (decl === undefined) {
            throw new Error(`Cannot instantiate undefined class, ${idNode.text}`);
        }

        const newId = new RefNode({
            origType: idNode.type,
            scope: idNode.scope,
            ref: decl,
        });
        const newChildren = [...newExprNode.children];
        newChildren[idIndex] = newId;

        return { ...newExprNode, children: newChildren };
    };

    private transformThis = (thisNode: ScopedRefNode): ScopedRefNode => {
        const thisRef = thisNode.scope.lookup('this');
        if (thisRef === undefined) {
            throw new Error("'this' is undefined");
        }
        return new RefNode({
            ref: thisRef,
            scope: thisNode.scope,
            origType: thisNode.type,
        });
    };

    private registerMemberExpression = (memberExprNode: ScopedRefNode): ScopedRefNode => {
        if (memberExprNode.children[MEMBER_OF].type === 'variable') {
            // this.i or a.i
            return this.memberOfVariable(memberExprNode);
        } else if (memberExprNode.children[MEMBER_OF].type === 'member_expression') {
            // this.a.i or a.j.k or A.B.j.k
            return this.memberOfMember(memberExprNode);
        } else if (memberExprNode.children[MEMBER_OF].type === 'identifier') {
            // console.log
            return this.memberOfIdentifier(memberExprNode);
        } else {
            throw new Error(
                'Unhandled member_expression. children[MEMBER_OF].type = ' + memberExprNode.children[MEMBER_OF].type,
            );
        }
    };

    private memberOfVariable = (node: Readonly<ScopedRefNode>): ScopedRefNode => {
        const refNode = node.children[MEMBER_OF] as RefNode;
        const id = node.children[MEMBER] as ScopedAST;
        const fieldClass = refNode.ref.instanceOf;
        if (fieldClass === undefined) {
            // the variable is probably a object, which we can not rename at the moment.
            return node;
        }

        const varDecl = fieldClass.lookup(id.text);

        if (varDecl === undefined) {
            throw new Error(`${id.text} does not exist on this`); // Kanskje bedre å bare la typescript ta seg av denne?
        }

        const newId = new RefNode({
            origType: id.type,
            ref: varDecl,
            scope: id.scope,
        });

        const newChildren = [...node.children];
        newChildren[MEMBER] = newId;

        return {
            ...node,
            children: newChildren,
        };
    };

    private memberOfMember = (node: Readonly<ScopedRefNode>): ScopedRefNode => {
        const id = node.children[MEMBER];
        const memberOfMemberNode = this.registerMemberExpression(node.children[MEMBER_OF]);
        const memberOf = memberOfMemberNode.children[MEMBER] as RefNode;
        const memberOfInstance = memberOf.ref.instanceOf;
        if (memberOfInstance === undefined) {
            // I'm a member of something we can not rename, i.e. object, console.log, etc.
            return node;
        }

        const varDecl = memberOfInstance.lookup(id.text);

        if (varDecl === undefined) {
            throw new Error(`${id.text} does not exist on class ${memberOfInstance.origName}`);
        }

        const newId = new RefNode({
            origType: id.type,
            ref: varDecl,
            scope: id.scope,
        });
        const newChildren = [...node.children];
        newChildren[MEMBER] = newId;

        return {
            ...node,
            children: newChildren,
        };
    };

    private memberOfIdentifier = (node: Readonly<ScopedRefNode>): ScopedRefNode => {
        const memberOfId = node.children[MEMBER_OF] as ScopedAST;
        const memberId = node.children[MEMBER] as ScopedAST;

        const memberOfVarDecl = node.scope.lookup(memberOfId.text);
        if (memberOfVarDecl === undefined || memberOfVarDecl.instanceOf === undefined) {
            // I'm something that can not be renamed, i.e. console.log
            return node;
        }

        const memberVarDecl = memberOfVarDecl.instanceOf.lookup(memberId.text);

        if (memberVarDecl === undefined) {
            throw new Error(`${memberId.text} does not exist on object ${memberOfId.text}`);
        }

        const memberOfRefNode = new RefNode({
            origType: memberOfId.type,
            ref: memberOfVarDecl,
            scope: memberOfId.scope,
        });
        const memberRefNode = new RefNode({
            origType: memberId.type,
            ref: memberVarDecl,
            scope: memberId.scope,
        });

        return {
            ...node,
            children: [memberOfRefNode, node.children[1], memberRefNode],
        };
    };
}

function getHeritageNodes(heritageNode: ScopedRefNode): { extendsClause?: ScopedAST; implementsClause?: ScopedAST } {
    const extendsClause = heritageNode.children.find(typeIs('extends_clause'));
    const implementsClause = heritageNode.children.find(typeIs('implements_clause'));
    return { extendsClause, implementsClause };
}
