export default class Variable {
    origName : string;
    name : string;
    instanceOf : Variable | undefined;
    instancesOfMe : Variable[] | undefined

    constructor(name: string, instanceOf : Variable | undefined) {
        this.name = name;
        this.origName = name;
        this.instanceOf = instanceOf;
        if(instanceOf === undefined) {
            this.instancesOfMe = []
        } else {
            this.instancesOfMe = undefined;
        }
    }

    rename(newName: string) {
        this.name = newName;
        return this;
    }

    addInstanceOfMe(v : Variable) {
        const res = this.instancesOfMe?.push(v)
        if(res === undefined) throw new Error(`${this.origName} is not a class.`)
        return this;
    }

    toString() {
        return this.name;
    }
}
