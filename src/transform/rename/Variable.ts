export default class Variable {
    origName : string;
    name : string;
    instanceOf : Variable | undefined;

    constructor(name: string, instanceOf : Variable | undefined) {
        this.name = name;
        this.origName = name;
        this.instanceOf = instanceOf;
    }

    rename(newName: string) {
        this.name = newName;
        return this;
    }

    toString() {
        return this.name;
    }
}
