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
      [$.named_parameter, $.type, $.expression],
      [$.unnamed_parameter, $.parenthesized_type],
      [$.infer_type],
      [$.intersection_type],
      [$.union_type],
      [$.type, $.expression],
      [$.type, $.named_parameter],
      [$.expression, $.number_literal_type],
      [$.expression, $.string_literal_type],
      [$.expression, $.export_statement],
      [$.expression, $.type_parameter],
      [$.expression, $.expression_miscellaneous3],
      [$.call_expression, $.unary_expression, $.binary_expression_relational],
      [$.member_expression, $.call_expression, $.unary_expression, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_logical_or],
      [$.typeof_type, $.expression],
      [$.member_expression, $.call_expression, $.binary_expression_relational, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_relational, $.binary_expression_logical_or],
      [$.call_expression, $.binary_expression_additive, $.binary_expression_relational],
      [$.member_expression, $.call_expression, $.binary_expression_additive, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_additive, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_bitwise_and, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_bitwise_and, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_bitwise_or, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_bitwise_or, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_logical_or, $.expression_assignment_and_miscellaneous],
      [$.call_expression, $.binary_expression_exponentiation, $.binary_expression_relational],
      [$.member_expression, $.call_expression, $.binary_expression_exponentiation, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_exponentiation, $.binary_expression_logical_or],
      [$.call_expression, $.binary_expression_multiplicative, $.binary_expression_relational],
      [$.member_expression, $.call_expression, $.binary_expression_multiplicative, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_multiplicative, $.binary_expression_logical_or],
      [$.call_expression, $.binary_expression_bitwise_shift, $.binary_expression_relational],
      [$.member_expression, $.call_expression, $.binary_expression_bitwise_shift, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_bitwise_shift, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_equality, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_equality, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_bitwise_xor, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_bitwise_xor, $.binary_expression_logical_or],
      [$.member_expression, $.call_expression, $.binary_expression_logical_and, $.expression_assignment_and_miscellaneous],
      [$.unary_expression, $.binary_expression_logical_and, $.binary_expression_logical_or],
      [$.type, $.type_predicate],
      [$.type, $.type_predicate, $.expression],
      [$.call_expression, $.binary_expression_comma],
      ...(isIsd ? [] : [[$.type_alias_declaration, $.type]]),
      [$.binary_expression_comma],
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
      [
        'indexed_expression',
        'member_expression',
        'call_expression',
        'new_expression',
        'unary_expression_postfix',
        'unary_expression_prefix',
        'binary_expression_exponentiation',
        'binary_expression_multiplicative',
        'binary_expression_additive',
        'binary_expression_bitwise_shift',
        'binary_expression_relational',
        'binary_expression_equality',
        'binary_expression_bitwise_and',
        'binary_expression_bitwise_xor',
        'binary_expression_bitwise_or',
        'binary_expression_logical_and',
        'binary_expression_logical_or',
        'expression_assignment_and_miscellaneous',
        'expression_miscellaneous2', // TODO: rename
        'expression_miscellaneous3', // TODO: rename
        'binary_expression_comma',
        'function_expression',
        'arrow_function_expression',
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
        optional(seq(
          'is',
          field('asserts_type', $.type),
        )),
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
        $.type_parameters,
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
        field('name', $.identifier),
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        ':',
        field('return_type', $.return_type),
      ),

      expression: $ => choice(
        $.identifier,
        $.number,
        $.string,
        $.parenthesized_expression,
        $.indexed_expression,
        $.member_expression,
        $.call_expression,
        $.new_expression,
        $.unary_expression,
        $.binary_expression,
        $.expression_assignment_and_miscellaneous,
        $.expression_miscellaneous2,
        $.expression_miscellaneous3,
        $.function_expression,
        $.arrow_function_expression,
        'return',
        'break',
        'continue',
      ),

      parenthesized_expression: $ => seq('(', $.expression, ')'),

      indexed_expression: $ => prec('indexed_expression', seq(
        field('expression', $.expression),
        '[',
        field('subscript', $.expression),
        ']',
      )),

      member_expression: $ => prec('member_expression', seq(
        field('expression', $.expression),
        optional('?'),
        '.',
        field('field', $.identifier),
      )),

      call_expression: $ => prec('call_expression', seq(
        field('expression', $.expression),
        optional(seq('?', '.')),
        optional($.type_parameters),
        '(',
        separatedRepeat($.expression, 'args'),
        ')',
      )),

      new_expression: $ => prec('new_expression', seq(
        'new',
        field('expression', $.expression),
        optional($.type_parameters),
        '(',
        separatedRepeat($.expression, 'args'),
        ')',
      )),

      unary_expression: $ => choice(
        prec('unary_expression_postfix', seq(
          field('expression', $.expression),
          field('operator', choice('++', '--', '!', '??', '!!')),
        )),
        prec('unary_expression_prefix', seq(
          field('operator', choice('++', '--', '!', '~', '+', '-', 'typeof', 'void', 'delete')),
          field('expression', $.expression),
        )),
      ),

      binary_expression: $ => choice(
        $.binary_expression_exponentiation,
        $.binary_expression_multiplicative,
        $.binary_expression_additive,
        $.binary_expression_bitwise_shift,
        $.binary_expression_relational,
        $.binary_expression_equality,
        $.binary_expression_bitwise_and,
        $.binary_expression_bitwise_xor,
        $.binary_expression_bitwise_or,
        $.binary_expression_logical_and,
        $.binary_expression_logical_or,
        $.binary_expression_comma,
      ),
      binary_expression_exponentiation: $ => prec.right('binary_expression_exponentiation', seq(
        field('lhs', $.expression),
        field('operator', '**'),
        field('rhs', $.expression),
      )),
      binary_expression_multiplicative: $ => prec.left('binary_expression_multiplicative', seq(
        field('lhs', $.expression),
        field('operator', choice('*', '/', '%')),
        field('rhs', $.expression),
      )),
      binary_expression_additive: $ => prec.left('binary_expression_additive', seq(
        field('lhs', $.expression),
        field('operator', choice('+', '-')),
        field('rhs', $.expression),
      )),
      binary_expression_bitwise_shift: $ => prec.left('binary_expression_bitwise_shift', seq(
        field('lhs', $.expression),
        field('operator', choice('<<', '>>', '>>>')),
        field('rhs', $.expression),
      )),
      binary_expression_relational: $ => prec.left('binary_expression_relational', seq(
        field('lhs', $.expression),
        field('operator', choice('<', '<=', '>', '>=', 'in', 'instanceof')),
        field('rhs', $.expression),
      )),
      binary_expression_equality: $ => prec.left('binary_expression_equality', seq(
        field('lhs', $.expression),
        field('operator', choice('==', '!=')),
        field('rhs', $.expression),
      )),
      binary_expression_bitwise_and: $ => prec.left('binary_expression_bitwise_and', seq(
        field('lhs', $.expression),
        field('operator', '&'),
        field('rhs', $.expression),
      )),
      binary_expression_bitwise_xor: $ => prec.left('binary_expression_bitwise_xor', seq(
        field('lhs', $.expression),
        field('operator', '^'),
        field('rhs', $.expression),
      )),
      binary_expression_bitwise_or: $ => prec.left('binary_expression_bitwise_or', seq(
        field('lhs', $.expression),
        field('operator', '|'),
        field('rhs', $.expression),
      )),
      binary_expression_logical_and: $ => prec.left('binary_expression_logical_and', seq(
        field('lhs', $.expression),
        field('operator', '&&'),
        field('rhs', $.expression),
      )),
      binary_expression_logical_or: $ => prec.left('binary_expression_logical_or', seq(
        field('lhs', $.expression),
        field('operator', choice('||', '??')),
        field('rhs', $.expression),
      )),
      expression_assignment_and_miscellaneous: $ => prec.right('expression_assignment_and_miscellaneous', choice(
        seq(
          field('lhs', $.expression),
          field('operator', choice('=', '+=', '-=', '**=', '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '&&=', '||=', '??=')),
          field('rhs', $.expression),
        ),
        seq(
          field('condition', $.expression),
          '?',
          field('if_true', $.expression),
          ':',
          field('if_false', $.expression),
        ),
      )),
      expression_miscellaneous2: $ => prec('expression_miscellaneous2', seq(
        field('operator', choice('yield', seq('yield', '*'))),
        field('expression', $.expression),
      )),
      expression_miscellaneous3: $ => prec('expression_miscellaneous3', seq(
        field('operator', choice('return', 'throw', 'break')),
        field('expression', $.expression),
      )),
      binary_expression_comma: $ => prec.left('binary_expression_comma', seq(
        field('lhs', $.expression),
        field('operator', ','),
        field('rhs', $.expression),
      )),

      function_expression: $ => prec('function_expression', seq(
        'function',
        optional(field('name', $.identifier)),
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        ':',
        field('return_type', $.return_type),
        choice(
          seq('{', repeat($.statement), optional($.expression), '}'),
          seq('=>', $.expression),
        ),
      )),

      arrow_function_expression: $ => prec('arrow_function_expression', seq(
        optional(field('type_parameters', $.type_parameters)),
        '(',
        separatedRepeat($.parameter, "parameter"),
        ')',
        '=>',
        $.expression,
      )),

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
          field('expression', seq(
            field('value', $.expression),
            'as',
            field('name', $.identifier),
          )),
        ), 'export'),
        '}',
        ';',
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
