import test from 'ava';
import transpile from '../src';

test('Rename non-existing class A to B', (t) => {
    const program = `
template T {
    class X {
        i = 0;
    }
}

package P {
    inst T { A -> B };
}
`;

    try {
        transpile(program, { emitFile: false, targetLanguage: 'ts' });
        t.fail('Wrongly succeeds transpilation when renaming non-existing class');
    } catch (e) {
        t.pass('Successfully throws error when renaming non-existing class');
    }
});
