import test from 'ava';
import transpile from '../src';

test('Renames field i to j', (t) => {
    const program = `
template T {
    class A {
        i = 0;
        
        constructor(i: number) {
            this.i = i; 
        }
    }
}

package P {
    inst T { A -> A (i -> j) } ;
}
`

    const expected = `class A {
    j = 0;
    constructor(i: number) {
        this.j = i;
    }
}
`
    const result = transpile(program, {emitFile: false,targetLanguage: 'ts' });

    t.is(result, expected);
})
