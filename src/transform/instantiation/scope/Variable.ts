import Class from './Class';

export default class Variable {
    origName: string;
    name: string;
    instanceOf?: Class;

    constructor(name: string, instanceOf?: Class) {
        this.name = name;
        this.origName = name;
        this.instanceOf = instanceOf;

        // if (instanceOf) instanceOf.addInstanceOfMe(this);
    }

    rename(newName: string): Variable {
        this.name = newName;
        return this;
    }

    toString(): string {
        return this.name;
    }
}
