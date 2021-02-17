import test from 'ava';
import transpile from '../src';

test('Renames field i to j', (t) => {
    const program = `
template T {
    class A {
        i = 0;

        constructor(n : number) {
            this.i = n;
        }
    }
}

pack P {
    inst T { A -> A (i -> j) };
}
`;

    const expected = `class A {
    j = 0;
    constructor(n: number) {
        this.j = n;
    }
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
