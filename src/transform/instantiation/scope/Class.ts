import Scope from './Scope';
import ASTTransformable from './ASTTransformable';
import Attribute from './Attribute';
import { ScopedAST } from './ASTScoper';
import Template from './Template';
import { typeIs } from '../../../util';
import { ASTNode } from '../../../AST';
import { Renaming } from './Inst';

type StagedRenaming = {[key: string]: [Attribute, string]};

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

export default class Class {
    className: string;
    superclass?: Class;
    implementedInterfaces?: string[];
    scope: Scope;
    bodyScope: Scope;
    attributes: Attribute[];
    template: Template;
    superclassName?: string;
    initialized = false;

    private constructor({
        className,
        scope,
        bodyScope,
        attributes,
        implementedInterfaces,
        template,
        superclassName
    }: {
        className: string;
        scope: Scope;
        bodyScope: Scope;
        attributes: Attribute[];
        implementedInterfaces?: string[];
        template: Template;
        superclassName?: string;
    }) {
        this.className = className;
        this.scope = scope;
        this.bodyScope = bodyScope;
        this.attributes = attributes;
        this.implementedInterfaces = implementedInterfaces;
        this.template = template;
        this.superclassName = superclassName;

        attributes.forEach(attr => attr.memberOf = this);
    }

    public static fromClassDeclaration = (classDeclaration: ScopedAST, template: Template): Class => {
        const { name, heritage, body } = parseClassDeclaration(classDeclaration);

        const attributes: Attribute[] = body.children.map(Attribute.fromDeclaration);

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

    public registerSuperclass() {

    }

    public renameAttributes = (attributeRenamings: Renaming[]): Class => {
        const cls = this.clone()

        const stagedAttributeRenames = attributeRenamings.reduce<StagedRenaming>((obj, attrRename) => {
            if(attrRename.old in obj) {
                throw new Error(`Can't rename same attribute twice. Attribute ${attrRename.old} in class ${cls.className} in template ${cls.template.name}.`)
            }

            const attr = cls.findAttribute(attrRename.old);
            if(attr === undefined) {
                throw new Error(`Can't rename attribute ${attrRename.old} in class ${cls.className} in template ${cls.template.name} because attribute does not exist.`);
            }
            return {...obj, [attrRename.old]: [attr, attrRename.new]};
        }, {})

        Object.keys(stagedAttributeRenames).forEach((oldAttrName) => {
            const [attr, newName] = stagedAttributeRenames[oldAttrName]
            const attrIndex = cls.attributes.findIndex(attr => attr.name === oldAttrName);
            if(attrIndex === -1) {
                throw new Error(`Impossible state! Attribute that has already been renamed can't be found in class.`)
            }

            cls.attributes[attrIndex] = attr.rename(newName)
        });

        return cls;
    }

    public clone = () : Class => ({...this})

    public findAttribute = (attributeName: string) : Attribute | undefined => this.attributes.find(attr => attr.name === attributeName);

    

    toAST : () => ASTNode = () {
        throw new Error('Method not implemented.');
    }
}

function parseClassDeclaration(
    classDeclaration: ScopedAST,
): { name: string; body: ClassBody; heritage?: { superclass?: string; implementedInterfaces?: string[] } } {
    const name = classDeclaration.children.find(typeIs('type_identifier'))?.text;
    if (name === undefined) throw new Error('Impossible state! Class does not have a name');

    let heritage = undefined;
    const heritageNode = classDeclaration.children.find(typeIs('class_heritage'));
    if (heritageNode !== undefined) {
        const extendsClause = heritageNode.children.find(typeIs('extends_clause'));
        const classExtends = extendsClause?.children.find(typeIs('type_identifier'))?.text;

        const implementsClause = heritageNode.children.find(typeIs('implements_clause'));
        const classImplements = implementsClause?.children.filter(typeIs('type_identifier'))?.map((el) => el.text);

        heritage = { superclass: classExtends, implementedInterfaces: classImplements };
    }

    const body = ClassBody.fromClassDeclaration(classDeclaration);

    return { name, body, heritage };
}

class ClassBody implements ASTTransformable {
    bodyNode: ScopedAST;
    get children(): ScopedAST[] {
        return this.bodyNode.children.slice(1, -1);
    }
    get scope(): Scope {
        return this.bodyNode.scope;
    }

    private constructor(bodyNode: ScopedAST) {
        this.bodyNode = bodyNode;
    }

    static fromClassDeclaration(classDecl: ScopedAST) {
        const bodyNode = classDecl.children.find(typeIs('class_body'));
        if (bodyNode === undefined) throw new Error("Impossible state! Class doesn't have body");
        return new ClassBody(bodyNode);
    }

    toAST: () => ScopedAST = () => {
        return this.bodyNode;
    };
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
