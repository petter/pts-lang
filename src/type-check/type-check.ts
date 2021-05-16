import ts from 'typescript';
import * as tsvfs from '@typescript/vfs';

import { ASTNode } from '../AST';
import CollectionTypeError from '../error/CollectionTypeError';
import transform from '../transform';
import toTS from '../transform/toTS';
import { idTransform, typeIs } from '../util';

const compilerOptions: ts.CompilerOptions = ts.getDefaultCompilerOptions();

export default function typecheck(program: ASTNode) {
    const programWithoutPackagesTemplatesAST = transform(program, {
        package_declaration: () => [],
        template_declaration: () => [],
        default: idTransform,
    });
    const programWithoutPackagesTemplates = toTS(programWithoutPackagesTemplatesAST);

    function typecheckAndReturnId(node: ASTNode, children: ASTNode[]): ASTNode {
        const collectionName = children.find(typeIs('identifier'));
        const body = children.find(typeIs('package_template_body'));

        if (collectionName === undefined)
            throw new Error('Impossible state! Could not find collection name on package/template');
        if (body === undefined) throw new Error('Impossible state! Could not find collection body on package/template');

        const bodyTranspiled = programWithoutPackagesTemplates + toTS(body);

        const fsMap = tsvfs.createDefaultMapFromNodeModules({ target: ts.ScriptTarget.ES2020 });
        fsMap.set('index.ts', bodyTranspiled);
        const system = tsvfs.createSystem(fsMap);
        const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts);

        const program = ts.createProgram({
            rootNames: [...fsMap.keys()],
            options: compilerOptions,
            host: host.compilerHost,
        });

        const sourceFile = program.getSourceFile('index.ts');
        const diagnostics = program.getSemanticDiagnostics(sourceFile);
        const errors = diagnostics.filter((diag) => diag.category === ts.DiagnosticCategory.Error);
        if (errors.length > 0) {
            const errorMessage = errors.map((el) => el.messageText).join('\n');
            throw new CollectionTypeError(collectionName.text, errorMessage);
        }

        return { ...node, children };
    }

    transform(program, {
        template_declaration: typecheckAndReturnId,
        package_declaration: typecheckAndReturnId,
        default: idTransform,
    });
}
