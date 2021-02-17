import test from 'ava';
import transpile from '../src';

test('Transpiles closed package to the body of the package', (t) => {
    const program = `
pack P {
    class A {
        i = 0;
    }
}
`;

    const expected = `class A {
    i = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
