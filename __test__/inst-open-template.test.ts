import test from 'ava';
import transpile from '../src';

test('Correctly merges the bodies of the two templates', (t) => {
    const program = `
template T1 {
    class A {
        i = 0;
    }
}

template T2 {
    inst T1;
    class B {
        j = 0;
    }
}

package P {
    inst T2;
}
`;

    const expected = `class A {
    i = 0;
}
class B {
    j = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
