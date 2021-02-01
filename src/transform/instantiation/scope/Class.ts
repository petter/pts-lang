import Variable from './Variable';
import Scope from './Scope';

export default class Class extends Variable {
    instancesOfMe: Variable[] = [];
    childClasses: Class[] = [];
    scope: Scope;
    superClass?: Class;
    constructor(name: string, scope: Scope) {
        super(name, undefined);
        this.scope = scope;
        this.instanceOf = this;
    }

    lookup(name: string): Variable | undefined {
        return this.scope.lookup(name) || this.superClass?.lookup(name);
    }

    addSuperClass(superClass: Class): Class {
        this.superClass = superClass;
        superClass.addChildClass(this);
        return this;
    }

    addInstanceOfMe(v: Variable): Class {
        this.instancesOfMe.push(v);
        return this;
    }

    addChildClass(c: Class): Class {
        this.childClasses.push(c);
        return this;
    }
}
