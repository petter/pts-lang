import test from 'ava';
import transpile from '../src';

test('Renames class A to B and then to C, and field i to j and then to k', (t) => {
    const program = `
template T1 {
    class A {
        i = 0;
    }
}

template T2 {
    inst T1 { A -> B (i -> j) };
}

package P {
    inst T2 { B -> C (j -> k) };
}
`;

    const expected = `class C {
    k = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
