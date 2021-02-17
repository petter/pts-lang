import test from 'ava';
import transpile from '../src';

test('Simple addto statement', (t) => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

pack P {
    inst T;
    addto A {
        j = 0; 
    }
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
