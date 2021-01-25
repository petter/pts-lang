const transpile = require('../build').default

it('Transpiles closed template to nothing', () => {
    const program = `
template P {
    class A {
        i = 0;
    }
}
`

    const expected = ``
    const result = transpile(program, {emitFile: false, emitFormat: 'ts' });

    expect(result).toBe(expected);
})
