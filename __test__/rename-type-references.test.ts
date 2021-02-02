import test from 'ava';
import transpile from '../src';

test('Renames type reference of class A to B', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
    
    class X {
        a : A = new A();
    }
}

package P {
    inst T { A -> B };
}
`;

    const expected = `class B {
    i = 0;
}

class X {
    a : B = new B();
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
