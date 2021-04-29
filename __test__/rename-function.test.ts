import test from 'ava';
import transpile from '../src';

test('Rename function f to g', (t) => {
    const program = `
template T {
    class A {
        f() {
            return 1;
        } 
    }
}

pack P {
    inst T { A -> A (f -> g) };
}
`;

    const expected = `class A {
    f() {
        return 1;
    }
}
`;

    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
