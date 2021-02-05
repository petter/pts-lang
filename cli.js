#!/usr/bin/env node

const yargs = require('yargs');
const {transpileFile} = require('./build/index');

if (require.main === module) {
    const argv = yargs
        .option('input', {
            type: 'string',
            alias: 'i',
            demandOption: true,
            description: 'Name of the input file',
        })
        .option('output', {
            type: 'string',
            alias: 'o',
            demandOption: false,
            description: 'Name of the output file',
        })
        .option('verbose', {
            type: 'boolean',
            alias: 'v',
            description: 'Show extra information during transpilation',
        })
        .option('targetLanguage', {
            alias: ['t', 'target'],
            choices: ['js', 'ts'],
            demandOption: false,
            description: 'Target language of the transpiler',
            default: 'js',
        })
        .option('run', {
            alias: ['r'],
            type: 'boolean',
            demandOption: true,
            default: false,
        })
        .argv;
    const result = transpileFile(argv.input, {
        verbose: argv.verbose,
        output: argv.output,
        emitFile: !argv.run,
        targetLanguage: argv.targetLanguage,
    });

    if(argv.run) eval(result || '');
}
