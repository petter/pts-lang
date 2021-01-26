"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var ts = __importStar(require("typescript"));
var tree_sitter_1 = __importDefault(require("tree-sitter"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var yargs_1 = __importDefault(require("yargs"));
// @ts-ignore
var helpers_1 = require("yargs/helpers");
var lodash_1 = __importDefault(require("lodash"));
var AST_1 = require("./AST");
var transform_1 = __importDefault(require("./transform"));
var replaceInstantiations_1 = __importDefault(require("./transform/instantiation/replaceInstantiations"));
var toTS_1 = __importDefault(require("./transform/toTS"));
// tslint:disable-next-line: no-var-requires
var PTS = require("tree-sitter-pts");
var parser = new tree_sitter_1.default();
parser.setLanguage(PTS);
function transpile(sourceCode, _options) {
    var options = __assign({ emitFormat: 'js', verbose: false, output: 'out', emitFile: true }, lodash_1.default.omitBy(_options, function (field) { return field === undefined; }));
    var parseTree = parser.parse(sourceCode);
    var ast = AST_1.toAST(parseTree);
    if (options.verbose)
        console.log(toSExpressions(ast));
    try {
        var inst = replaceInstantiations_1.default(ast);
        var outputContent = options.emitFormat === 'ts' ? toTS_1.default(inst) : ts.transpileModule(toTS_1.default(inst), { compilerOptions: { module: ts.ModuleKind.ES2020 } }).outputText;
        if (options.emitFile) {
            var outputFile = options.output + (options.emitFormat === 'js' ? '.js' : '.ts');
            fs_1.default.writeFileSync(outputFile, outputContent);
        }
        else {
            return outputContent;
        }
    }
    catch (e) {
        console.error(e);
        throw e;
        if (require.main === module)
            process.exit(1);
    }
}
exports.default = transpile;
function transpileFile(file, options) {
    var content = fs_1.default.readFileSync(file, "utf-8");
    var backupFileName = path_1.default.basename(file, '.pts');
    return transpile(content, __assign(__assign({}, options), { output: options.output || backupFileName }));
}
exports.transpileFile = transpileFile;
if (require.main === module) {
    var argv = yargs_1.default(helpers_1.hideBin(process.argv))
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
        .argv;
    transpileFile(argv.input, { verbose: argv.verbose, output: argv.output, emitFormat: argv.emitFormat });
}
function toSExpressions(ast) {
    var sExprTransformer = {
        default: function (node, children) { return node.type + " (" + children.join(", ") + ")"; },
    };
    var sExprs = transform_1.default(ast, sExprTransformer);
}
