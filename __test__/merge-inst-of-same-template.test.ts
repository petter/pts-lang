import test from 'ava';
import transpile from '../src';

test('Correctly merges the bodies of the class with the same name and no overlapping members', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

pack P {
    inst T;
    inst T { A -> A (i -> j) };
}
`;

    const expected = `class A {
    i = 0;
    j = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
