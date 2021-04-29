"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RIGHT_BRACKET_NODE = exports.RIGHT_BRACKET = exports.LEFT_BRACKET_NODE = exports.LEFT_BRACKET = exports.SEMI = exports.COMMA_NODE = exports.COMMA = exports.CLASS_BODY = exports.IMPLEMENTS = exports.IMPLEMENTS_CLAUSE = exports.EXTENDS = exports.EXTENDS_CLAUSE = exports.CLASS_HERITAGE = exports.CLASS = exports.CLASS_DECLARATION = exports.IDENTIFIER = exports.TYPE_IDENTIFIER = exports.METHOD_DEFINITION = exports.PUBLIC_FIELD_DEFINITION = exports.PROGRAM = exports.RENAME = exports.FIELD_RENAMINGS = exports.CLASS_RENAME = exports.CLASS_RENAMINGS = exports.ADDTO_STATEMENT = exports.INST_STATEMENT = exports.PACKAGE_TEMPLATE_BODY = exports.TEMPLATE_NODE = exports.TEMPLATE = exports.TEMPLATE_DECL = exports.PACK_NODE = exports.PACK = exports.PACKAGE_DECL = void 0;
// PT
exports.PACKAGE_DECL = 'package_declaration';
exports.PACK = 'pack';
exports.PACK_NODE = { type: exports.PACK, text: exports.PACK, children: [] };
exports.TEMPLATE_DECL = 'template_declaration';
exports.TEMPLATE = 'template';
exports.TEMPLATE_NODE = { type: exports.TEMPLATE, text: exports.TEMPLATE, children: [] };
exports.PACKAGE_TEMPLATE_BODY = 'package_template_body';
exports.INST_STATEMENT = 'inst_statement';
exports.ADDTO_STATEMENT = 'addto_statement';
exports.CLASS_RENAMINGS = 'class_renamings';
exports.CLASS_RENAME = 'class_rename';
exports.FIELD_RENAMINGS = 'field_renamings';
exports.RENAME = 'rename';
// TypeScript
exports.PROGRAM = 'program';
exports.PUBLIC_FIELD_DEFINITION = 'public_field_definition';
exports.METHOD_DEFINITION = 'method_definition';
exports.TYPE_IDENTIFIER = 'type_identifier';
exports.IDENTIFIER = 'identifier';
exports.CLASS_DECLARATION = 'class_declaration';
exports.CLASS = 'class';
exports.CLASS_HERITAGE = 'class_heritage';
exports.EXTENDS_CLAUSE = 'extends_clause';
exports.EXTENDS = 'extends';
exports.IMPLEMENTS_CLAUSE = 'implements_clause';
exports.IMPLEMENTS = 'implements';
exports.CLASS_BODY = 'class_body';
exports.COMMA = ',';
exports.COMMA_NODE = {
    type: exports.COMMA,
    text: ',',
    children: [],
};
exports.SEMI = ';';
exports.LEFT_BRACKET = '{';
exports.LEFT_BRACKET_NODE = {
    type: exports.LEFT_BRACKET,
    text: exports.LEFT_BRACKET,
    children: [],
};
exports.RIGHT_BRACKET = '}';
exports.RIGHT_BRACKET_NODE = {
    type: exports.RIGHT_BRACKET,
    text: exports.RIGHT_BRACKET,
    children: [],
};
