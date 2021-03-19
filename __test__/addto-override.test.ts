import test from 'ava';
import transpile from '../src';

test('Addto statement overrides method correctly', (t) => {
    const program = `
template T {
    class A {
        function f() {
            return 1;
        }
    }
}

pack P {
    inst T;
    addto A {
        function f() {
            return 0;
        }
    }
}
`;

    const actual = transpile(program, { emitFile: false, targetLanguage: 'ts' });

    const expected = `class A {
    function f() {
        return 0;
    }
}`;
    t.is(actual, expected);
});
