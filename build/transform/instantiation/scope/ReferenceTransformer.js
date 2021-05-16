"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefNode = void 0;
const util_1 = require("../../../util");
const MEMBER_OF = 0;
const MEMBER = 2;
class RefNode {
    constructor({ origType, ref, scope }) {
        this.type = 'variable';
        this.text = '';
        this.children = [];
        this.origType = origType;
        this.ref = ref;
        this.scope = scope;
    }
}
exports.RefNode = RefNode;
/**
 * Travels the tree to register declarations, and then transforms the nodes that reference a class or a class field to
 * a @RefNode.
 */
class ReferenceTransformer {
    constructor(program) {
        this.applyToNodesOfType = (typeFuncMap) => {
            function applyToNodesOfTypeRecurse(node) {
                let newNode = node;
                if (node.type in typeFuncMap) {
                    newNode = typeFuncMap[node.type](node);
                }
                const newChildren = newNode.children.map(applyToNodesOfTypeRecurse);
                return { ...newNode, children: newChildren };
            }
            this.program = applyToNodesOfTypeRecurse(this.program);
        };
        this.registerDeclarations = () => {
            this.registerAllClassDeclarations();
            this.registerClassHeritages();
            this.registerClassFieldDeclarations();
        };
        this.registerAllClassDeclarations = () => {
            this.applyToNodesOfType({ class_declaration: this.registerClassDeclaration });
        };
        this.registerClassDeclaration = (node) => {
            const classNameIndex = node.children.findIndex(util_1.typeIs('type_identifier'));
            const classNameNode = node.children[classNameIndex];
            const className = classNameNode.text;
            const classScope = node.children.find(util_1.typeIs('class_body')).scope;
            const classDecl = node.scope.defineClass(className, classScope);
            const classRefNode = new RefNode({ origType: classNameNode.type, ref: classDecl, scope: node.scope });
            const newChildren = [...node.children];
            newChildren[classNameIndex] = classRefNode;
            return { ...node, children: newChildren };
        };
        this.registerClassHeritages = () => {
            this.applyToNodesOfType({ class_declaration: this.registerClassHeritage });
        };
        this.registerClassHeritage = (node) => {
            const EXTENDS_CLAUSE = 0;
            let hasExtends = false;
            const heritageIndex = node.children.findIndex(util_1.typeIs('class_heritage'));
            if (heritageIndex === -1)
                return node;
            const subClassRef = node.children.find(util_1.typeIs('variable'));
            const heritageNode = { ...node.children[heritageIndex], children: [...node.children[heritageIndex].children] };
            const { extendsClause, implementsClause } = getHeritageNodes(heritageNode);
            if (extendsClause !== undefined) {
                hasExtends = true;
                // TypeScript grammar allows for several superclasses, so we will treat it as allowed as well.
                // TODO: Also allow it in Class-class
                const newExtendsClauseChildren = [...extendsClause.children].map((child) => {
                    if (child.type === 'extends' || child.type === ',')
                        return child;
                    if (child.type === 'type_identifier')
                        return this.transformTypeIdentifier(child);
                    if (child.type === 'generic_type')
                        return this.transformGenericTypeIdentifier(child);
                    throw new Error(child.type + ' is not a supported superclass');
                });
                heritageNode.children[EXTENDS_CLAUSE] = { ...extendsClause, children: newExtendsClauseChildren };
                const firstSuperClass = newExtendsClauseChildren[1];
                let firstRefNode;
                if (firstSuperClass instanceof RefNode) {
                    firstRefNode = firstSuperClass;
                }
                else {
                    // TODO maybe generic_type or some class that can't be renamed
                    firstRefNode = firstSuperClass.children[0];
                }
                // TODO: Do something like this for interfaces as well
                if (subClassRef !== undefined) {
                    if (firstRefNode instanceof RefNode) {
                        subClassRef.ref.addSuperClass(firstRefNode.ref);
                    }
                }
                else {
                    throw new Error("Can't find subclass" + node.children);
                }
            }
            if (implementsClause !== undefined) {
                const newImplementsClauseChildren = [...implementsClause.children].map((child) => {
                    if (child.type === 'implements' || child.type === ',')
                        return child;
                    if (child.type === 'type_identifier')
                        return this.transformTypeIdentifier(child);
                    if (child.type === 'generic_type')
                        return this.transformGenericTypeIdentifier(child);
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
        this.transformType = (node) => {
            if (node.type === 'type_identifier')
                return this.transformTypeIdentifier(node);
            if (node.type === 'generic_type')
                return this.transformGenericTypeIdentifier(node);
            if (node.type === 'predefined_type')
                return node;
            if (node.type === 'type_predicate')
                return this.transformTypePredicate(node);
            if (node.type === 'object_type')
                return node;
            return node;
            //throw new Error('Unsupported type: ' + node.type);
        };
        this.transformTypeIdentifier = (typeIdentifierNode) => {
            const classRef = typeIdentifierNode.scope.lookupClass(typeIdentifierNode.text);
            if (classRef === undefined)
                return typeIdentifierNode;
            return new RefNode({ origType: typeIdentifierNode.type, scope: typeIdentifierNode.scope, ref: classRef });
        };
        this.transformGenericTypeIdentifier = (genericTypeNode) => {
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
                if (ignoredNodes.includes(child.type))
                    return child;
                return this.transformType(child);
            });
            return newGenericTypeNode;
        };
        this.transformTypePredicate = (node) => {
            const TYPE_INDEX = 2;
            const newChildren = [...node.children];
            newChildren[TYPE_INDEX] = this.transformType(newChildren[TYPE_INDEX]);
            return { ...node, children: newChildren };
        };
        this.registerClassFieldDeclarations = () => {
            this.applyToNodesOfType({ public_field_definition: this.registerPublicFieldDefinition });
        };
        this.registerPublicFieldDefinition = (node) => {
            const idNodeIndex = node.children.findIndex(util_1.typeIs('property_identifier'));
            const idNode = node.children[idNodeIndex];
            const newExprNode = node.children.find(util_1.typeIs('new_expression'));
            // TODO: Hva med generics? new A<B>(); Kanskje nok med en pass over type_identifiers?
            const instanceOf = newExprNode?.children.find(util_1.typeIs('identifier'))?.text;
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
        this.registerReferences = () => {
            this.applyToNodesOfType({
                this: this.transformThis,
            });
            this.applyToNodesOfType({
                new_expression: this.registerNewExpression,
                member_expression: this.registerMemberExpression,
                type_annotation: this.transformTypeAnnotation,
            });
        };
        // TODO: Support type expressions
        this.registerNewExpression = (newExprNode) => {
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
        this.transformThis = (thisNode) => {
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
        this.transformIdentifier = (node) => {
            const identifier = node.text;
            const maybeRef = node.scope.lookup(identifier);
            if (maybeRef === undefined) {
                return node;
            }
            return new RefNode({
                scope: node.scope,
                origType: node.type,
                ref: maybeRef,
            });
        };
        this.registerMemberExpression = (memberExprNode) => {
            if (memberExprNode.children[MEMBER_OF].type === 'variable') {
                // this.i or a.i
                return this.memberOfVariable(memberExprNode);
            }
            else if (memberExprNode.children[MEMBER_OF].type === 'member_expression') {
                // this.a.i or a.j.k or A.B.j.k
                return this.memberOfMember(memberExprNode);
            }
            else if (memberExprNode.children[MEMBER_OF].type === 'identifier') {
                // console.log
                return this.memberOfIdentifier(memberExprNode);
            }
            else {
                throw new Error('Unhandled member_expression. children[MEMBER_OF].type = ' + memberExprNode.children[MEMBER_OF].type);
            }
        };
        this.memberOfVariable = (node) => {
            const refNode = node.children[MEMBER_OF];
            const id = node.children[MEMBER];
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
        this.memberOfMember = (node) => {
            const id = node.children[MEMBER];
            const memberOfMemberNode = this.registerMemberExpression(node.children[MEMBER_OF]);
            const memberOf = memberOfMemberNode.children[MEMBER];
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
        this.memberOfIdentifier = (node) => {
            const memberOfId = node.children[MEMBER_OF];
            const memberId = node.children[MEMBER];
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
        this.transformTypeAnnotation = (node) => {
            const TYPE_INDEX = 1;
            const newChildren = [...node.children];
            newChildren[TYPE_INDEX] = this.transformType(newChildren[TYPE_INDEX]);
            return { ...node, children: newChildren };
        };
        this.program = program;
    }
}
exports.default = ReferenceTransformer;
ReferenceTransformer.transform = (program) => {
    const referenceTransformer = new ReferenceTransformer(program);
    referenceTransformer.registerDeclarations();
    referenceTransformer.registerReferences();
    return referenceTransformer.program;
};
function getHeritageNodes(heritageNode) {
    const extendsClause = heritageNode.children.find(util_1.typeIs('extends_clause'));
    const implementsClause = heritageNode.children.find(util_1.typeIs('implements_clause'));
    return { extendsClause, implementsClause };
}
