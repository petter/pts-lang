"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Variable_1 = __importDefault(require("./Variable"));
const Class_1 = __importDefault(require("./Class"));
class Scope {
    constructor(parentScope) {
        this.variables = [];
        this.classes = [];
        this.parentScope = parentScope;
    }
    static createRootScope() {
        return new Scope();
    }
    static create(parentScope) {
        return new Scope(parentScope);
    }
    lookup(name) {
        return this.variables.find((v) => v.origName === name) || this.parentScope?.lookup(name);
    }
    lookupClass(name) {
        return this.classes.find((c) => c.origName === name) || this.parentScope?.lookupClass(name);
    }
    defineClass(name, scope) {
        const classDef = new Class_1.default(name, scope);
        this.classes.push(classDef);
        this.variables.push(classDef);
        scope.defineVariable('this', name);
        return classDef;
    }
    defineVariable(name, instanceOfName) {
        const instanceOf = instanceOfName ? this.lookupClass(instanceOfName) : undefined;
        const varDef = new Variable_1.default(name, instanceOf);
        this.variables.push(varDef);
        return varDef;
    }
    rename(oldName, newName) {
        const v = this.lookup(oldName);
        if (v === undefined) {
            throw new Error(`Variable ${oldName} does not exist and can not be renamed.`);
        }
        else {
            v.rename(newName);
        }
        return this;
    }
    renameField(instanceOf, oldName, newName) {
        // Rename declaration
        const instanceOfClass = this.lookupClass(instanceOf);
        if (instanceOfClass === undefined) {
            throw new Error(`Class ${instanceOf} does not exist, and we can therefore not rename ${oldName} to ${newName}`);
        }
        const fieldDecl = instanceOfClass.lookup(oldName);
        if (fieldDecl === undefined) {
            throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
        }
        fieldDecl.rename(newName);
        // TODO: Rename references
        // const field = instanceOfClass.instancesOfMe.find(el => el.origName === oldName);
        // if(field === undefined) {
        //     throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
        // }
        // field.rename(newName);
        return this;
    }
    toString() {
        return this.variables.map((v) => v.name + ': ' + v.instanceOf?.name).join('\n');
    }
}
exports.default = Scope;
