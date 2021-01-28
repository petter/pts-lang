import test from 'ava';
import transpile from '../src';

test('Renames class A to B', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

package P {
    inst T { A -> B };
}
`

    const expected = `class B {
    i = 0;
}
`
    const result = transpile(program, {emitFile: false,targetLanguage: 'ts' });

    t.is(result, expected);
})
