class B {
    x = 0;
    static k = this.x;
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
    i = this.a.i;
    j = 0;
    k = A.k;
    constructor() {
        const b = new C();
        this.j = b.j;
    }
}
