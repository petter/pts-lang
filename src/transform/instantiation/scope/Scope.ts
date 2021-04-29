import Variable from './Variable';
import Class from './Class';

type VariableSymbolTable = {
    [origName: string]: Variable;
};

type ClassSymbolTable = {
    [origName: string]: Class;
};

export default class Scope {
    parentScope: undefined | Scope;
    variables: VariableSymbolTable = {};
    classes: ClassSymbolTable = {};

    private constructor(parentScope?: Scope) {
        this.parentScope = parentScope;
    }

    public static createRootScope(): Scope {
        return new Scope();
    }

    public static create(parentScope: Scope): Scope {
        return new Scope(parentScope);
    }

    lookup(name: string): undefined | Variable {
        throw new Error('lookup is depracated/not implemented');
    }

    defineClass(name: string, scope: Scope): Variable {
        throw new Error('defineClass is depracated/not implemented');
    }
    defineVariable(name: string, instanceOfName?: string): Variable {
        throw new Error('defineVariable is depracated/not implemented');
    }
    rename(oldName: string, newName: string): Scope {
        throw new Error('rename is depracated/not implemented');
    }
    renameField(instanceOf: string, oldName: string, newName: string): Scope {
        throw new Error('renameField is depracated/not implemented');
    }

    // lookup(name: string): undefined | Variable {
    //     return this.variables[name] || this.parentScope?.lookup(name);
    // }

    // lookupClass(name: string): undefined | Class {
    //     return this.classes[name] || this.parentScope?.lookupClass(name);
    // }

    // defineClass(name: string, scope: Scope): Variable {
    //     const classDef = new Class(name, scope);
    //     this.classes[name] = classDef;
    //     this.variables[name] = classDef;
    //     scope.defineVariable('this', name);
    //     return classDef;
    // }

    // defineVariable(name: string, instanceOfName?: string): Variable {
    //     const instanceOf = instanceOfName ? this.lookupClass(instanceOfName) : undefined;
    //     const varDef = new Variable(name, instanceOf);

    //     this.variables[name] = varDef;
    //     return varDef;
    // }

    // rename(oldName: string, newName: string): Scope {
    //     const v = this.lookup(oldName);
    //     if (v === undefined) {
    //         throw new Error(`Variable ${oldName} does not exist and can not be renamed.`);
    //     } else {
    //         v.rename(newName);
    //     }
    //     return this;
    // }

    // renameField(instanceOf: string, oldName: string, newName: string): Scope {
    //     // Rename declaration
    //     const instanceOfClass = this.lookupClass(instanceOf);
    //     if (instanceOfClass === undefined) {
    //         throw new Error(
    //             `Class ${instanceOf} does not exist, and we can therefore not rename ${oldName} to ${newName}`,
    //         );
    //     }

    //     const fieldDecl = instanceOfClass.lookup(oldName);
    //     if (fieldDecl === undefined) {
    //         throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
    //     }
    //     fieldDecl.rename(newName);

    //     return this;
    // }

    toString(): string {
        return Object.values(this.variables)
            .map((v) => v.name + ': ' + v.instanceOf?.name)
            .join('\n');
    }
}
