import * as ts from 'typescript';
import Parser from 'tree-sitter';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import _ from 'lodash';

import { ASTNode, toAST } from './AST';
import transform, { Transformer } from './transform';
import InstantiationTransformer from './transform/instantiation/replaceInstantiations';
import toTS from './transform/toTS';
import PTS = require('tree-sitter-pts');

const parser = new Parser();
parser.setLanguage(PTS);

type Options = {
    targetLanguage?: 'ts' | 'js';
    verbose?: boolean;
    output?: string | undefined;
    emitFile?: boolean;
};

export default function transpile(sourceCode: string, _options: Options): string | undefined {
    const options: Required<Options> = {
        targetLanguage: 'js',
        verbose: false,
        output: 'out',
        emitFile: true,
        ..._.omitBy(_options, (field) => field === undefined),
    };

    const parseTree = parser.parse(sourceCode);

    const ast = toAST(parseTree);

    if (options.verbose) console.log(toSExpressions(ast));

    const inst = InstantiationTransformer.transform(ast);
    const programTranspiled = toTS(inst);
    const outputContent =
        options.targetLanguage === 'ts'
            ? programTranspiled
            : ts.transpileModule(programTranspiled, { compilerOptions: { module: ts.ModuleKind.ES2020 } }).outputText;

    if (options.emitFile) {
        const outputFile = options.output + (options.targetLanguage === 'js' ? '.js' : '.ts');
        fs.writeFileSync(outputFile, outputContent);
    } else {
        return outputContent;
    }
}

export function transpileFile(file: string, options: Options): string | undefined {
    const content = fs.readFileSync(file, 'utf-8');
    const backupFileName = path.basename(file, '.pts');
    return transpile(content, { ...options, output: options.output || backupFileName });
}

if (require.main === module) {
    const argv = yargs(hideBin(process.argv))
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
        }).argv;
    transpileFile(argv.input, {
        verbose: argv.verbose,
        output: argv.output,
        targetLanguage: argv.targetLanguage as 'js' | 'ts',
    });
}

function toSExpressions(ast: ASTNode): string {
    const sExprTransformer: Transformer<ASTNode, string> = {
        default: (node, children) => `${node.type} (${children.join(', ')})`,
    };
    return transform(ast, sExprTransformer) as string;
}
