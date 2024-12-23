// @ts-check
/// <reference types="tree-sitter-cli/dsl" />

/**
 * @param {"is" | "isx"} language
 */
module.exports = function defineGrammar(language) {
  const isIsx = language === 'isx';

  return grammar({
    name: isIsx ? 'inferscriptreact' : 'inferscript',

    rules: {
      // The top-level rule
      program: $ => repeat($._top_level_statement),

      _top_level_statement: $ => choice(),

      // Basic tokens
      identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
      number: $ => /[1-9][0-9]*/,
      string: $ => /"([^"\\]|\\.)*"/,
    },
  });
}
