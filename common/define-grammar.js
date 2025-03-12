// @ts-check
/// <reference types="tree-sitter-cli/dsl" />

/**
 * @param {Rule} rule
 * @param {String} fieldName
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat1(rule, fieldName, sep = ',') {
  return seq(
    field(fieldName, rule),
    repeat(seq(
      sep,
      field(fieldName, rule),
    )),
    optional(sep),
  );
}

/**
 * @param {Rule} rule
 * @param {String} fieldName
 * @param {String} sep
 * @returns {Rule}
 */
function separatedRepeat(rule, fieldName, sep = ',') {
  return optional(separatedRepeat1(rule, fieldName, sep));
}

/**
 * @param {"is" | "isx" | "isd"} language
 */
module.exports = function defineGrammar(language) {
  const isIs = language === 'is';
  const isIsx = language === 'isx';
  const isIsd = language === 'isd';

  return grammar({
    name: isIs ? 'inferscript' : isIsx ? 'inferscriptreact' : 'inferscriptdefinition',

    externals: $ => [
      $.template_literal_start_end,
      $.template_literal_start,
      $.template_literal_end,
      $.template_literal_middle,
    ],

    conflicts: $ => [
      [$.named_parameter, $.type],
      [$.unnamed_parameter, $.parenthesized_type],
      [$.infer_type],
      [$.intersection_type],
      [$.union_type],
    ],

    precedences: $ => [
      [
        'generic_type',
        'indexed_type',
        'member_type',
        'keyof_type',
        'readonly_type',
        'negated_type',
        'infer_type',
        'return_type',
        'type_predicate',
        'extends_type',
        'function_type',
        'call_signature',
        'intersection_type',
        'union_type',
        'conditional_type',
      ],
    ],

    rules: {
      program: $ => repeat($.statement),

      statement: $ => choice(
        $.type_alias_declaration,
        ...(isIsd ? [
          $.declare_variable_declaration,
          $.declare_function_declaration,
        ] : [
          $.expression_statement,
          $.export_statement,
        ]),
        $.export_type_statement,
      ),

      type_alias_declaration: $ => choice(
        seq(
          optional(field('export', 'export')),
          optional(field('unique', 'unique')),
          'type',
          field('name', $.identifier),
          field('type_parameters', optional($.type_parameters)),
          '=',
          field('type', $.type),
          ';',
        ),
        seq(
          optional(field('export', 'export')),
          optional(field('unique', 'unique')),
          'type',
          field('name', $.identifier),
          field('type_parameters', optional($.type_parameters)),
          optional(seq(
            'extends',
            separatedRepeat1($.type, 'extends'),
          )),
          choice(
            field('fields', $.object_type),
            ';',
          ),
        ),
      ),

      type_parameters: $ => seq(
        '<',
        separatedRepeat1($.type_parameter, 'parameter'),
        '>',
      ),

      type_parameter: $ => seq(
        optional(field('const', 'const')),
        field('name', $.identifier),
        field('type_parameters', optional($.type_parameters)),
        optional(seq(
          'extends',
          field('extends', $.type),
        )),
        optional(seq(
          'constraints',
          field('constraints', $.type),
        )),
        optional(seq(
          '=',
          field('type', $.type),
        )),
      ),

      type: $ => choice(
        $.identifier,
        $.parenthesized_type,
        $.indexed_type,
        $.member_type,
        $.generic_type,
        $.object_type,
        $.array_type,
        $.tuple_type,
        $.typeof_type,
        $.keyof_type,
        $.literal_type,
        $.negated_type,
        $.extends_type,
        $.conditional_type,
        $.template_literal_type,
        $.intersection_type,
        $.union_type,
        $.function_type,
        $.readonly_type,
        $.infer_type,
        'const',
      ),

      object_type: $ => seq(
        '{',
        separatedRepeat($._object_type_field, 'field', ';'),
        '}',
      ),

      _object_type_field: $ => choice(
        $.call_signature,
        $.object_type_field,
        $.object_type_mapped_field,
      ),

      call_signature: $ => prec('call_signature', seq(
        optional(seq(
          optional(field('abstract', 'abstract')),
          field('new', 'new'),
        )),
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        ':',
        field('return_type', $.return_type),
      )),

      return_type: $ => prec('return_type', choice(
        $.type,
        $.type_predicate,
      )),

      type_predicate: $ => prec('type_predicate', seq(
        optional(seq(
          optional(field('type', $.type)),
          field('asserts', 'asserts')
        )),
        field('name', $.identifier),
        'is',
        field('asserts_type', $.type),
      )),

      parameter: $ => choice(
        $.named_parameter,
        $.unnamed_parameter,
      ),

      named_parameter: $ => seq(
        field('name', $.identifier),
        optional(field('optional', '?')),
        ':',
        field('type', $.type),
      ),

      unnamed_parameter: $ => seq(
        field('type', $.type),
        optional(field('optional', '?')),
      ),

      object_type_field: $ => seq(
        optional(seq(
          optional(field('remove_readonly', '-')),
          field('readonly', 'readonly'),
        )),
        field('name', $.identifier),
        optional(seq(
          optional(field('remove_optional', '-')),
          field('optional', '?'),
        )),
        optional(seq(
          ':',
          field('type', $.type),
        )),
      ),

      object_type_mapped_field: $ => seq(
        '[',
        optional(seq(
          field('key_type', $.identifier),
          'in',
        )),
        field('key', $.type),
        ']',
        ':',
        field('type', $.type),
      ),

      parenthesized_type: $ => seq(
        '(',
        field('type', $.type),
        ')',
      ),

      indexed_type: $ => prec('indexed_type', seq(
        field('type', $.type),
        '[',
        field('subscript', $.type),
        ']',
      )),

      member_type: $ => prec('member_type', seq(
        field('type', $.type),
        '.',
        field('field', $.identifier),
      )),

      generic_type: $ => prec('generic_type', seq(
        field('type', $.type),
        '<',
        separatedRepeat1($.type, 'type_parameter'),
        '>',
      )),

      array_type: $ => seq(
        field('type', $.type),
        '[',
        ']',
      ),

      tuple_type: $ => seq(
        '[',
        separatedRepeat($.parameter, 'type'),
        ']',
      ),

      typeof_type: $ => seq(
        'typeof',
        field('value', $.identifier),
      ),

      keyof_type: $ => prec('keyof_type', seq(
        'keyof',
        field('type', $.type),
      )),

      literal_type: $ => choice(
        $.number_literal_type,
        $.string_literal_type,
        'true',
        'false',
        'null',
        'undefined',
      ),

      negated_type: $ => prec('negated_type', seq(
        '!',
        field('type', $.type),
      )),

      extends_type: $ => prec.right("extends_type", seq(
        field('from', $.type),
        'extends',
        field('to', $.type),
      )),

      conditional_type: $ => prec.right('conditional_type', seq(
        field('lhs', $.type),
        '?',
        field('chs', $.type),
        ':',
        field('rhs', $.type),
      )),

      template_literal_type: $ => choice(
        $.template_literal_type_1,
        $.template_literal_type_n,
      ),

      template_literal_type_1: $ => seq(
        $.template_literal_start_end,
      ),

      template_literal_type_n: $ => seq(
        $.template_literal_start,
        $.type,
        repeat(seq(
          $.template_literal_middle,
          $.type,
        )),
        $.template_literal_end,
      ),

      intersection_type: $ => prec('intersection_type', seq(
        field('type', $.type),
        repeat1(prec('intersection_type', seq(
          '&',
          field('type', $.type),
        ))),
      )),

      union_type: $ => prec('union_type', seq(
        field('type', $.type),
        repeat1(prec('union_type', seq(
          '|',
          field('type', $.type),
        ))),
      )),

      function_type: $ => prec('function_type', seq(
        optional(seq(
          optional(field('abstract', 'abstract')),
          field('new', 'new'),
        )),
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        '=>',
        field('return_type', $.return_type),
      )),

      readonly_type: $ => prec("readonly_type", seq(
        'readonly',
        field('type', $.type),
      )),

      infer_type: $ => prec('infer_type', seq(
        'infer',
        field('type', $.identifier),
        optional(seq(
          'extends',
          field('extends', $.type),
          optional(seq(
            'constraints',
            field('constraints', $.type),
          )),
        )),
      )),

      number_literal_type: $ => $.number,

      string_literal_type: $ => $.string,

      declare_variable_declaration: $ => seq(
        optional(field('export', 'export')),
        'declare',
        field('val', choice('let', 'const')),
        field('name', $.identifier),
        optional(field('optional', '?')),
        ':',
        field('type', $.type),
        ';',
      ),

      declare_function_declaration: $ => seq(
        optional(field('export', 'export')),
        'declare',
        'function',
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        ':',
        field('return_type', $.return_type),
      ),

      expression: $ => choice(
        $.identifier,
        // TODO: ...
      ),

      expression_statement: $ => seq(
        $.expression,
        ';'
      ),

      export_statement: $ => seq(
        'export',
        '{',
        separatedRepeat(choice(
          field('identifier', seq(optional(field('type', 'type')), $.identifier)),
          field('type', seq(
            'type',
            field('value', $.type),
            'as',
            field('name', $.identifier),
          )),
          field('value', seq(
            field('value', $.expression),
            'as',
            field('name', $.identifier),
          )),
        ), 'export'),
        '}',
      ),

      export_type_statement: $ => seq(
        'export',
        'type',
        '{',
        separatedRepeat(choice(
          field('identifier', $.identifier),
          field('type', seq(
            field('value', $.type),
            'as',
            field('name', $.identifier),
          )),
        ), 'export'),
        '}',
        ';',
      ),

      // Basic tokens
      identifier: $ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,
      number: $ => /0|[1-9]\d*(\\.\d+)?([eE]-?\d+)?|0[bB][01]+|0[oO][0-7]+|0[xX][0-9a-f]+/,
      string: $ => /"([^"\\]|\\.)*"/,
    },
  });
}
