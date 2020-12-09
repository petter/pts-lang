import Variable from "./Variable";
import Scope from "./Scope";

export default class Class extends Variable {
    instancesOfMe : Variable[] = [];
    scope : Scope;
    constructor(name : string, scope : Scope) {
        super(name, undefined);
        this.scope = scope;
    }

    addInstanceOfMe(v : Variable) {
        const res = this.instancesOfMe.push(v)
        if(res === undefined) throw new Error(`${this.origName} is not a class.`)
        return this;
    }
}