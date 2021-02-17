import test from 'ava';
import transpile from '../src';

test('Merges class A and B and then C', (t) => {
    const program = `
template T1 {
    class A {
        i = 0;
    }
}

template T2 {
    class B {
        i = 0;
    }
}

template T3 {
    inst T1;
    inst T2 { B -> A (i -> j) };
}

pack P {
    inst T1;
    inst T3 { A -> A (i -> k) };
}
`;

    const expected = `class A {
    i = 0;
    k = 0;
    j = 0;
}
`;
    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
