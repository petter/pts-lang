"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Attribute_1 = __importDefault(require("./Attribute"));
const util_1 = require("../../../../build/util");
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
    constructor({ className, scope, bodyScope, attributes, superclass, implementedInterfaces, }) {
        this.className = className;
        this.scope = scope;
        this.bodyScope = bodyScope;
        this.attributes = attributes;
        this.superclass = superclass;
        this.implementedInterfaces = implementedInterfaces;
    }
}
exports.default = Class;
Class.fromClassDeclaration = (classDeclaration) => {
    const { name, heritage, body } = parseClassDeclaration(classDeclaration);
    const attributes = body.children.map(Attribute_1.default.fromDeclaration);
    let superclass;
    if (heritage && heritage.superclass) {
        superclass = classDeclaration.scope.lookupClass(heritage.superclass);
    }
    const cls = new Class({
        className: name,
        scope: classDeclaration.scope,
        bodyScope: body.scope,
        attributes: attributes,
        superclass: superclass,
        implementedInterfaces: heritage?.implementedInterfaces,
    });
    return cls;
};
function parseClassDeclaration(classDeclaration) {
    const name = classDeclaration.children.find(util_1.typeIs('type_identifier'))?.text;
    if (name === undefined)
        throw new Error('Impossible state! Class does not have a name');
    let heritage = undefined;
    const heritageNode = classDeclaration.children.find(util_1.typeIs('class_heritage'));
    if (heritageNode !== undefined) {
        const extendsClause = heritageNode.children.find(util_1.typeIs('extends_clause'));
        const classExtends = extendsClause?.children.find(util_1.typeIs('type_identifier'))?.text;
        const implementsClause = heritageNode.children.find(util_1.typeIs('implements_clause'));
        const classImplements = implementsClause?.children.filter(util_1.typeIs('type_identifier'))?.map((el) => el.text);
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
        const bodyNode = classDecl.children.find(util_1.typeIs('class_body'));
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
