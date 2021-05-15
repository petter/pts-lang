import test from 'ava';
import transpile from '../src';

test('External superclass is allowed', (t) => {
    const program = `
class SuperA {
    i = 0;
}

template T {
    class A extends SuperA {
        j = 0;
    }
}

pack P {
    inst T;
}
`;

    const expected = `class SuperA {
    i = 0;
}

class A extends SuperA {
    j = 0;
}
`;

    const result = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    t.is(result, expected);
});
