"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Attribute_1 = __importDefault(require("./Attribute"));
const util_1 = require("../../../util");
const token_kinds_1 = require("../../../token-kinds");
// export default class Class extends Variable {
//     instancesOfMe: Variable[] = [];
//     childClasses: Class[] = [];
//     scope: Scope;
//     superClass?: Class;
//     constructor(name: string, scope: Scope) {
//         super(name, undefined);
//         this.scope = scope;
//         this.instanceOf = this;
//     }
//     lookup(name: string): Variable | undefined {
//         return this.scope.lookup(name) || this.superClass?.lookup(name);
//     }
//     addSuperClass(superClass: Class): Class {
//         this.superClass = superClass;
//         superClass.addChildClass(this);
//         return this;
//     }
//     addInstanceOfMe(v: Variable): Class {
//         this.instancesOfMe.push(v);
//         return this;
//     }
//     addAttribute(): Class {
//         return this;
//     }
//     addChildClass(c: Class): Class {
//         this.childClasses.push(c);
//         return this;
//     }
// }
class Class {
    constructor({ className, scope, bodyScope, attributes, implementedInterfaces, template, superclassName, }) {
        this.initialized = false;
        // public registerSuperclass() {}
        this.renameAttributes = (attributeRenamings) => {
            const cls = this.clone();
            const stagedAttributeRenames = attributeRenamings.reduce((obj, attrRename) => {
                if (attrRename.old in obj) {
                    throw new Error(`Can't rename same attribute twice. Attribute ${attrRename.old} in class ${cls.name} in template ${cls.template.name}.`);
                }
                const attr = cls.findAttribute(attrRename.old);
                if (attr === undefined) {
                    throw new Error(`Can't rename attribute ${attrRename.old} in class ${cls.name} in template ${cls.template.name} because attribute does not exist.`);
                }
                return { ...obj, [attrRename.old]: [attr, attrRename.new] };
            }, {});
            Object.keys(stagedAttributeRenames).forEach((oldAttrName) => {
                const [attr, newName] = stagedAttributeRenames[oldAttrName];
                const attrIndex = cls.attributes.findIndex((attr) => attr.name === oldAttrName);
                if (attrIndex === -1) {
                    throw new Error(`Impossible state! Attribute that has already been renamed can't be found in class.`);
                }
                cls.attributes[attrIndex] = attr.rename(newName);
            });
            return cls;
        };
        this.clone = () => Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        this.findAttribute = (attributeName) => this.attributes.find((attr) => attr.name === attributeName);
        this.toAST = () => {
            console.log(this.name);
            return {
                type: token_kinds_1.CLASS_DECLARATION,
                text: '',
                children: [
                    {
                        type: token_kinds_1.CLASS,
                        text: token_kinds_1.CLASS,
                        children: [],
                    },
                    { type: token_kinds_1.TYPE_IDENTIFIER, text: this.name, children: [] },
                    this.heritageToAST(),
                    this.attributesToAST(),
                ].filter((el) => el !== undefined),
            };
        };
        this.heritageToAST = () => {
            if (this.implementedInterfaces === undefined && this.superclassName === undefined)
                return undefined;
            const heritageBody = [];
            if (this.superclassName !== undefined) {
                heritageBody.push({
                    type: token_kinds_1.EXTENDS_CLAUSE,
                    text: '',
                    children: [
                        { type: token_kinds_1.EXTENDS, text: token_kinds_1.EXTENDS, children: [] },
                        { type: token_kinds_1.TYPE_IDENTIFIER, text: this.superclassName, children: [] },
                    ],
                });
            }
            if (this.implementedInterfaces !== undefined) {
                const implementedInterfacesAST = this.implementedInterfaces.flatMap((interfaceName) => [
                    {
                        type: token_kinds_1.TYPE_IDENTIFIER,
                        text: interfaceName,
                        children: [],
                    },
                    token_kinds_1.COMMA_NODE,
                ]);
                implementedInterfacesAST.pop();
                heritageBody.push({
                    type: token_kinds_1.IMPLEMENTS_CLAUSE,
                    text: '',
                    children: [{ type: token_kinds_1.IMPLEMENTS, text: token_kinds_1.IMPLEMENTS, children: [] }, ...implementedInterfacesAST],
                });
            }
            return {
                type: token_kinds_1.CLASS_HERITAGE,
                text: '',
                children: heritageBody,
            };
        };
        this.attributesToAST = () => {
            const attributesAST = this.attributes.map((attr) => attr.toAST());
            return {
                type: token_kinds_1.CLASS_BODY,
                text: '',
                children: [token_kinds_1.LEFT_BRACKET_NODE, ...attributesAST, token_kinds_1.RIGHT_BRACKET_NODE],
            };
        };
        this.name = className;
        this.scope = scope;
        this.bodyScope = bodyScope;
        this.attributes = attributes;
        this.implementedInterfaces = implementedInterfaces;
        this.template = template;
        this.superclassName = superclassName;
        attributes.forEach((attr) => (attr.memberOf = this));
    }
}
exports.default = Class;
Class.fromClassDeclaration = (classDeclaration, template) => {
    const { name, heritage, body } = parseClassDeclaration(classDeclaration);
    const attributes = body.children
        .map(Attribute_1.default.fromDeclaration)
        .filter((el) => el !== undefined);
    const cls = new Class({
        className: name,
        scope: classDeclaration.scope,
        bodyScope: body.scope,
        attributes: attributes,
        implementedInterfaces: heritage?.implementedInterfaces,
        template: template,
        superclassName: heritage?.superclass,
    });
    return cls;
};
function parseClassDeclaration(classDeclaration) {
    const name = classDeclaration.children.find(util_1.typeIs(token_kinds_1.TYPE_IDENTIFIER))?.text;
    if (name === undefined)
        throw new Error('Impossible state! Class does not have a name');
    let heritage = undefined;
    const heritageNode = classDeclaration.children.find(util_1.typeIs(token_kinds_1.CLASS_HERITAGE));
    if (heritageNode !== undefined) {
        const extendsClause = heritageNode.children.find(util_1.typeIs(token_kinds_1.EXTENDS_CLAUSE));
        const classExtends = extendsClause?.children.find(util_1.typeIs(token_kinds_1.TYPE_IDENTIFIER))?.text;
        const implementsClause = heritageNode.children.find(util_1.typeIs(token_kinds_1.IMPLEMENTS_CLAUSE));
        const classImplements = implementsClause?.children.filter(util_1.typeIs(token_kinds_1.TYPE_IDENTIFIER))?.map((el) => el.text);
        heritage = { superclass: classExtends, implementedInterfaces: classImplements };
    }
    const body = ClassBody.fromClassDeclaration(classDeclaration);
    return { name, body, heritage };
}
class ClassBody {
    constructor(bodyNode) {
        this.toAST = () => {
            return this.bodyNode;
        };
        this.bodyNode = bodyNode;
    }
    get children() {
        return this.bodyNode.children.slice(1, -1);
    }
    get scope() {
        return this.bodyNode.scope;
    }
    static fromClassDeclaration(classDecl) {
        const bodyNode = classDecl.children.find(util_1.typeIs(token_kinds_1.CLASS_BODY));
        if (bodyNode === undefined)
            throw new Error("Impossible state! Class doesn't have body");
        return new ClassBody(bodyNode);
    }
}
//     private getClassName = () => {
//         const className = this.classDecl.children.find(typeIs('type_identifier'));
//         if (className === undefined) throw new Error('Class has no name');
//         return className;
//     };
// class ClassTransformer {
//     private classDecl: ScopedAST;
//     private constructor(classDecl: ScopedAST) {
//         this.classDecl = classDecl;
//     }
//     public static transform(classDecl: ScopedAST): Class {
//         if (classDecl.type !== 'class_declaration')
//             throw new Error("Can't transform non-class_declaration node to a Class");
//         const classTransformer = new ClassTransformer(classDecl);
//         const className = classTransformer.getClassName();
//     }
// }
