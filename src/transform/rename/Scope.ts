import Variable from "./Variable"

export default class Scope {
    parentScope : undefined | Scope
    variables : Variable[] = [];

    constructor(parentScope : undefined | Scope) {
        this.parentScope = parentScope;
    }

    lookup(name : string) : undefined | Variable {
        return this.variables.find(v => v.origName === name)
            || this.parentScope?.lookup(name);
    }

    defineClass(name: string) : Variable {
        const varDef = new Variable(name, undefined);
        this.variables.push(varDef);
        return varDef;
    }

    defineVariable(name : string, instanceOfName : string) : Variable {
        const instanceOf = this.lookup(instanceOfName);
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

    toString() {
        return this.variables.map(v => v.name + ': ' + v.instanceOf?.name).join('\n');
    }
}
