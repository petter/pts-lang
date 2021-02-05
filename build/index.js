#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileFile = void 0;
const ts = __importStar(require("typescript"));
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const lodash_1 = __importDefault(require("lodash"));
// @ts-ignore
const PTS = require("tree-sitter-pts");
const AST_1 = require("./AST");
const transform_1 = __importDefault(require("./transform"));
const InstantiationTransformer_1 = __importDefault(require("./transform/instantiation/InstantiationTransformer"));
const toTS_1 = __importDefault(require("./transform/toTS"));
const parser = new tree_sitter_1.default();
parser.setLanguage(PTS);
function transpile(sourceCode, _options) {
    const options = {
        targetLanguage: 'js',
        verbose: false,
        output: 'out',
        emitFile: true,
        ...lodash_1.default.omitBy(_options, (field) => field === undefined),
    };
    const parseTree = parser.parse(sourceCode);
    const ast = AST_1.toAST(parseTree);
    if (options.verbose)
        console.log(toSExpressions(ast));
    const inst = InstantiationTransformer_1.default.transform(ast);
    const programTranspiled = toTS_1.default(inst);
    const outputContent = options.targetLanguage === 'ts'
        ? programTranspiled
        : ts.transpileModule(programTranspiled, { compilerOptions: { module: ts.ModuleKind.ES2020 } }).outputText;
    if (options.emitFile) {
        const outputFile = options.output + (options.targetLanguage === 'js' ? '.js' : '.ts');
        fs_1.default.writeFileSync(outputFile, outputContent);
    }
    else {
        return outputContent;
    }
}
exports.default = transpile;
function transpileFile(file, options) {
    const content = fs_1.default.readFileSync(file, 'utf-8');
    const backupFileName = path_1.default.basename(file, '.pts');
    return transpile(content, { ...options, output: options.output === undefined ? backupFileName : options.output });
}
exports.transpileFile = transpileFile;
if (require.main === module) {
    const argv = yargs_1.default
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
    }).argv;
    const result = transpileFile(argv.input, {
        verbose: argv.verbose,
        output: argv.output,
        emitFile: !argv.run,
        targetLanguage: argv.targetLanguage,
    });
    if (argv.run)
        eval(result || '');
}
function toSExpressions(ast) {
    const sExprTransformer = {
        default: (node, children) => `${node.type} (${children.join(', ')})`,
    };
    return transform_1.default(ast, sExprTransformer);
}
