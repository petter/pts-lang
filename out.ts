class B {
    x = 0;
    s = "prøve";
    static n = this.x;
    constructor() {
        console.log("test");
    }
}
class C extends B {
    j = 1;
    a = new B();
    constructor() {
        super();
        this.x = 2;
        this.j = 3;
    }
}
class X {
    a = new B();
    i = this.a.x;
    j = 0;
    k = B.n;
    constructor() {
        const b = new C();
        this.j = b.j;
    }
}
