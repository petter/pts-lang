"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Variable {
    constructor(name, instanceOf) {
        this.name = name;
        this.origName = name;
        this.instanceOf = instanceOf;
        if (instanceOf)
            instanceOf.addInstanceOfMe(this);
    }
    rename(newName) {
        this.name = newName;
        return this;
    }
    toString() {
        return this.name;
    }
}
exports.default = Variable;
