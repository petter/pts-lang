import test from 'ava';
import transpile from '../src';

test('Transpiles instantiation of closed-template to the body of the closed template', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

package P {
    inst T;
}
`

    const expected = `class A {
    i = 0;
}
`
    const result = transpile(program, {emitFile: false,targetLanguage: 'ts' });

    t.is(result, expected);
})
