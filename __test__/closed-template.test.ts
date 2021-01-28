import test from 'ava';
import transpile from '../src';

test('Transpiles closed template to nothing', (t) => {
    const program = `
template P {
    class A {
        i = 0;
    }
}
`

    const expected = ``
    const result = transpile(program, {emitFile: false,targetLanguage: 'ts' });

    t.is(result, expected);
})
