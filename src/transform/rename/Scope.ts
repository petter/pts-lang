import Variable from "./Variable"

export default class Scope {
    parentScope : undefined | Scope
    variables : Variable[] = [];

    constructor(parentScope : undefined | Scope) {
        this.parentScope = parentScope;
    }

    lookup(name : string) : undefined | Variable {
        return this.variables.find(v => v.name === name)
            || this.parentScope?.lookup(name);
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
