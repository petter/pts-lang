import test from 'ava';
import transpile from '../src';

test('Renames field i to j, when i is used as a function argument', (t) => {
    const program = `
template T {
    class A {
        i = 0;
        
        f() {
            console.log(i);
        }
    }
}

package P {
    inst T { A -> A (i -> j) };
}
`;

    const expected = `class A {
    j = 0;
    f() {
        console.log(j);
    }
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
