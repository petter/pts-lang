const transpile = require('../build').default

it('Renames class A to B', () => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

package P {
    inst T { A -> B };
}
`

    const expected = `class B {
    i = 0;
}
`
    const result = transpile(program, {emitFile: false, emitFormat: 'ts' });

    expect(result).toBe(expected);
})
