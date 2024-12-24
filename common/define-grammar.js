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

    rules: {
      program: $ => repeat($._top_level_statement),

      _top_level_statement: $ => choice(
        $.type_alias_declaration,
      ),

      type_alias_declaration: $ => choice(
        seq(
          optional(field('export', 'export')),
          optional(field('unique', 'unique')),
          'type',
          field('name', $.identifier),
          field('type_parameters', optional($.type_parameters)),
          '=',
          field('value', $.type),
          optional(seq(
            'satisfies',
            field('satisfies', $.type),
          )),
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
        field('name', $.identifier),
        field('type_parameters', optional($.type_parameters)),
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
        $.constructor_type,
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

      call_signature: $ => seq(
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
      ),

      return_type: $ => choice(
        $.type,
        $.type_predicate,
        $.type_and_asserts,
      ),

      type_predicate: $ => seq(
        optional(field('asserts', 'asserts')),
        field('name', $.identifier),
        'is',
        field('asserts_type', $.type),
      ),

      type_and_asserts: $ => seq(
        field('type', $.type),
        'asserts',
        field('name', $.identifier),
        'is',
        field('asserts_type', $.type),
      ),

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

      indexed_type: $ => seq(
        field('type', $.type),
        '[',
        field('subscript', $.type),
        ']',
      ),

      member_type: $ => seq(
        field('type', $.type),
        '.',
        field('field', $.identifier),
      ),

      generic_type: $ => seq(
        field('type', $.type),
        '<',
        separatedRepeat1($.type, 'type_parameter'),
        '>',
      ),

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

      keyof_type: $ => seq(
        'keyof',
        field('type', $.type),
      ),

      literal_type: $ => choice(
        $.number_literal_type,
        $.string_literal_type,
        'true',
        'false',
        'null',
        'undefined',
      ),

      negated_type: $ => seq(
        '!',
        field('type', $.type),
      ),

      extends_type: $ => seq(
        field('from', $.type),
        'extends',
        field('to', $.type),
      ),

      conditional_type: $ => seq(
        field('lhs', $.type),
        '?',
        field('chs', $.type),
        ':',
        field('rhs', $.type),
      ),

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

      // Basic tokens
      identifier: $ => /[a-zA-Z_@#$][a-zA-Z0-9@#$_]*/,
      number: $ => /[1-9][0-9]*/,
      string: $ => /"([^"\\]|\\.)*"/,
    },
  });
}
