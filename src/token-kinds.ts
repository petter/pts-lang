import { ASTNode } from './AST';

// PT
export const PACKAGE_DECL = 'package_declaration';
export const PACK = 'pack';
export const PACK_NODE = { type: PACK, text: PACK, children: [] };
export const TEMPLATE_DECL = 'template_declaration';
export const TEMPLATE = 'template';
export const TEMPLATE_NODE = { type: TEMPLATE, text: TEMPLATE, children: [] };
export const PACKAGE_TEMPLATE_BODY = 'package_template_body';
export const INST_STATEMENT = 'inst_statement';
export const ADDTO_STATEMENT = 'addto_statement';
export const CLASS_RENAMINGS = 'class_renamings';
export const CLASS_RENAME = 'class_rename';
export const FIELD_RENAMINGS = 'field_renamings';
export const RENAME = 'rename';

// TypeScript
export const PROGRAM = 'program';

export const PUBLIC_FIELD_DEFINITION = 'public_field_definition';
export const METHOD_DEFINITION = 'method_definition';

export const TYPE_IDENTIFIER = 'type_identifier';
export const IDENTIFIER = 'identifier';

export const CLASS_DECLARATION = 'class_declaration';
export const CLASS = 'class';
export const CLASS_HERITAGE = 'class_heritage';
export const EXTENDS_CLAUSE = 'extends_clause';
export const EXTENDS = 'extends';
export const IMPLEMENTS_CLAUSE = 'implements_clause';
export const IMPLEMENTS = 'implements';
export const CLASS_BODY = 'class_body';

export const COMMA = ',';
export const COMMA_NODE: ASTNode = {
    type: COMMA,
    text: ',',
    children: [],
};
export const SEMI = ';';
export const LEFT_BRACKET = '{';
export const LEFT_BRACKET_NODE: ASTNode = {
    type: LEFT_BRACKET,
    text: LEFT_BRACKET,
    children: [],
};
export const RIGHT_BRACKET = '}';
export const RIGHT_BRACKET_NODE: ASTNode = {
    type: RIGHT_BRACKET,
    text: RIGHT_BRACKET,
    children: [],
};
