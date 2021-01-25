const transpile = require('../build').default

it('Transpiles to the body of the package', () => {
    const program = `
package P {
    class A {
        i = 0;
    }
}
`

    const expected = `class A {
    i = 0;
}
`
    const result = transpile(program, {emitFile: false, emitFormat: 'ts' });

    expect(result).toBe(expected);
})