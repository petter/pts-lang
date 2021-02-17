import test from 'ava';
import transpile from '../src';

test('Addto statement on a non-existing class fails', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

pack P {
    inst T;
    addto B {
        j = 0; 
    }
}
`;

    try {
        transpile(program, { emitFile: false, targetLanguage: 'ts' });
        t.fail('Transpilation succeeds with an addto statement for a non-existing class declaration');
    } catch (e) {
        t.pass('Transpilation fails correctly when addto to a non existing class');
    }
});
