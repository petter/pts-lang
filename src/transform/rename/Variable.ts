export default class Variable {
    name : string;
    instanceOf : Variable | undefined;

    constructor(name: string, instanceOf : Variable | undefined) {
        this.name = name;
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
