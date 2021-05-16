import test from 'ava';
import transpile from '../src';

test('Template-level type-check works as expected', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }

    class B {
        a : {j: number} = new A();
    }
}

pack P {
    inst T { A -> A (i -> j) };
}
`;

    try {
        transpile(program, { emitFile: false, targetLanguage: 'ts' });

        t.fail('Did not fail compilation even though there is a type-error in T');
    } catch (error) {
        t.pass('Successfully failed compilation due to type-error in T');
        // TODO: This should check that the Error is the correct type, however currently it is impossible to check instanceof on thrown errors
    }
});
