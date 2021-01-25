const transpile = require('../build').default

it('Transpiles instantiation of closed-template to the body of the closed template', () => {
    const program = `
template T {
    class A {
        i = 0;
    }
}

package P {
    inst T;
}
`

    const expected = `class A {
    i = 0;
}
`
    const result = transpile(program, {emitFile: false, emitFormat: 'ts' });

    expect(result).toBe(expected);
})
