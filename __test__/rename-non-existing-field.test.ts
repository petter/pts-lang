import test from 'ava';
import transpile from '../src';

test('Rename non-existing field i to j', (t) => {
    const program = `
template T {
    class A {
        x = 0;
    }
}

pack P {
    inst T { A -> A (i -> j) };
}
`;

    try {
        transpile(program, { emitFile: false, targetLanguage: 'ts' });
        t.fail('Wrongly succeeds transpilation when renaming non-existing field');
    } catch (e) {
        t.pass('Successfully throws error when renaming non-existing field');
    }
});
