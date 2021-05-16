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
const typescript_1 = __importDefault(require("typescript"));
const tsvfs = __importStar(require("@typescript/vfs"));
const CollectionTypeError_1 = __importDefault(require("../error/CollectionTypeError"));
const transform_1 = __importDefault(require("../transform"));
const toTS_1 = __importDefault(require("../transform/toTS"));
const util_1 = require("../util");
const compilerOptions = typescript_1.default.getDefaultCompilerOptions();
function typecheck(program) {
    const programWithoutPackagesTemplatesAST = transform_1.default(program, {
        package_declaration: () => [],
        template_declaration: () => [],
        default: util_1.idTransform,
    });
    const programWithoutPackagesTemplates = toTS_1.default(programWithoutPackagesTemplatesAST);
    function typecheckAndReturnId(node, children) {
        const collectionName = children.find(util_1.typeIs('identifier'));
        const body = children.find(util_1.typeIs('package_template_body'));
        if (collectionName === undefined)
            throw new Error('Impossible state! Could not find collection name on package/template');
        if (body === undefined)
            throw new Error('Impossible state! Could not find collection body on package/template');
        const bodyTranspiled = programWithoutPackagesTemplates + toTS_1.default(body);
        const fsMap = tsvfs.createDefaultMapFromNodeModules({ target: typescript_1.default.ScriptTarget.ES2020 });
        fsMap.set('index.ts', bodyTranspiled);
        const system = tsvfs.createSystem(fsMap);
        const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, typescript_1.default);
        const program = typescript_1.default.createProgram({
            rootNames: [...fsMap.keys()],
            options: compilerOptions,
            host: host.compilerHost,
        });
        const sourceFile = program.getSourceFile('index.ts');
        const diagnostics = program.getSemanticDiagnostics(sourceFile);
        const errors = diagnostics.filter((diag) => diag.category === typescript_1.default.DiagnosticCategory.Error);
        if (errors.length > 0) {
            const errorMessage = errors.map((el) => el.messageText).join('\n');
            throw new CollectionTypeError_1.default(collectionName.text, errorMessage);
        }
        return { ...node, children };
    }
    transform_1.default(program, {
        template_declaration: typecheckAndReturnId,
        package_declaration: typecheckAndReturnId,
        default: util_1.idTransform,
    });
}
exports.default = typecheck;
