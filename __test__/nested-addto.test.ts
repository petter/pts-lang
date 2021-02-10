import test from 'ava';
import transpile from '../src';

test('Nested addto statement', (t) => {
    const program = `
template T1 {
    class A {
        i = 0;
    }
}

template T2 {
    inst T1;
    addto A {
        j = 0;
    }
}

package P {
    inst T2;
    addto A {
        k = 0; 
    }
}
`;

    const expected = `class A {
    i = 0;
    j = 0;
    k = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
