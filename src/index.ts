import * as ts from 'typescript'
import Parser from "tree-sitter";
import fs from "fs";
import path from 'path';
import yargs from 'yargs';
// @ts-ignore
import {hideBin} from 'yargs/helpers';
import _ from 'lodash';

import { toAST, ASTNode } from "./AST";
import transform, { Transformer } from "./transform";
import replaceInstantiations from "./transform/instantiation/replaceInstantiations";
import toTS from "./transform/toTS";

// tslint:disable-next-line: no-var-requires
const PTS = require("tree-sitter-pts");

const parser = new Parser();
parser.setLanguage(PTS);

// "./examples/nested-class-merge-rename.pts";

type Options = {
    emitFormat?: 'ts' | 'js';
    verbose?: boolean;
    output?: string | undefined;
    emitFile?: boolean;
}

export default function transpile(sourceCode: string, _options: Options) {
    const options : Required<Options> = {
        emitFormat: 'js',
        verbose: false,
        output: 'out',
        emitFile: true,
        ..._.omitBy(_options, (field) => field === undefined),
    }

    const parseTree = parser.parse(sourceCode);

    const ast = toAST(parseTree);

    const sExprTransformer: Transformer<ASTNode, string> = {
        default: (node, children) => `${node.type} (${children.join(", ")})`,
    };
    const sExprs = transform(ast, sExprTransformer);
    if(options.verbose) console.log(sExprs)

    try {
        const inst = replaceInstantiations(ast);
        const outputContent = options.emitFormat === 'ts' ? toTS(inst) : ts.transpileModule(toTS(inst), {compilerOptions: {module: ts.ModuleKind.ES2020}}).outputText

        if (options.emitFile) {
            const outputFile = options.output + (options.emitFormat === 'js' ? '.js' : '.ts')
            fs.writeFileSync(outputFile, outputContent);
        } else {
            return outputContent;
        }
    } catch (e) {
        console.error(e);
        throw e;
        if(require.main === module) process.exit(1);
    }
}

export function transpileFile(file: string, options: Options) {
    const content = fs.readFileSync(file, "utf-8");
    const optionalOutFileName = path.basename(file, '.pts');
    return transpile(content, {...options, output: options.output || optionalOutFileName});
}

if (require.main === module) {
    const argv = yargs(hideBin(process.argv))
        .option('input', {
            type: 'string',
            alias: 'i',
            demandOption: true,
            description: 'Name of the input file' ,
        })
        .option('output', {
            type: 'string',
            alias: 'o',
            demandOption: false,
            description: 'Name of the output file'
        })
        .option('verbose', {
            type: 'boolean',
            alias: 'v',
            description: 'Show extra information during transpilation'
        })
        .option('emitFormat', {
            choices: ['js', 'ts'],
            demandOption: false,
            description: 'What format to transpile to',
            default: 'js',
        })
        .argv
    transpileFile(argv.input, {verbose: argv.verbose, output: argv.output, emitFormat: argv.emitFormat as 'js' | 'ts'})
}