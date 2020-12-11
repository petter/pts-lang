import Variable from "./Variable"
import Class from "./Class";

export default class Scope {
    parentScope : undefined | Scope
    variables : Variable[] = [];
    classes : Class[] = []

    constructor(parentScope : undefined | Scope) {
        this.parentScope = parentScope;
    }

    lookup(name : string) : undefined | Variable {
        return this.variables.find(v => v.origName === name)
            || this.parentScope?.lookup(name);
    }

    lookupClass(name : string) : undefined | Class {
        return this.classes.find(c => c.origName === name)
            || this.parentScope?.lookupClass(name);
    }

    defineClass(name: string, scope : Scope) : Variable {
        const classDef = new Class(name, scope);
        this.classes.push(classDef);
        this.variables.push(classDef);
        return classDef;
    }

    defineVariable(name : string, instanceOfName? : string) : Variable {
        const instanceOf = instanceOfName ? this.lookupClass(instanceOfName) : undefined;
        const varDef = new Variable(name, instanceOf);

        this.variables.push(varDef);
        return varDef;
    }

    rename(oldName : string, newName : string) {
        const v = this.lookup(oldName);
        if(v === undefined) {
            throw new Error(`Variable ${oldName} does not exist and can not be renamed.`);
        } else {
            return v.rename(newName)
        }
    }

    renameField(instanceOf : string, oldName : string, newName : string) {

        // Rename declaration
        const instanceOfClass = this.lookupClass(instanceOf);
        if(instanceOfClass === undefined) {
            throw new Error(`Class ${instanceOf} does not exist, and we can therefore not rename ${oldName} to ${newName}`);
        }

        const fieldDecl = instanceOfClass.lookup(oldName);
        if(fieldDecl === undefined) {
            throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
        }
        fieldDecl.rename(newName);

        // TODO: Rename references
        // const field = instanceOfClass.instancesOfMe.find(el => el.origName === oldName);
        // if(field === undefined) {
        //     throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
        // }
        // field.rename(newName);
    }

    toString() {
        return this.variables.map(v => v.name + ': ' + v.instanceOf?.name).join('\n');
    }
}
