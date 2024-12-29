#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  TEMPLATE_LITERAL_START_END,
  TEMPLATE_LITERAL_START,
  TEMPLATE_LITERAL_END,
  TEMPLATE_LITERAL_MIDDLE,
};

static inline void *inferscript_common_create(void) {
  return NULL;
}

static inline void inferscript_common_destroy(void *payload) {
  (void)payload;
}

static inline unsigned inferscript_common_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

static inline void inferscript_common_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

static inline bool inferscript_common_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;

  // Skip whitespace and comments
  while (iswspace(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }

  if (valid_symbols[TEMPLATE_LITERAL_START_END] && lexer->lookahead == '`') {
    lexer->advance(lexer, false);
    while (lexer->lookahead != '`' && lexer->lookahead != 0) {
      lexer->advance(lexer, false);
    }
    if (lexer->lookahead == '`') {
      lexer->advance(lexer, false);
      lexer->result_symbol = TEMPLATE_LITERAL_START_END;
      return true;
    }
    return false;
  }

  if (valid_symbols[TEMPLATE_LITERAL_START] && lexer->lookahead == '`') {
    lexer->advance(lexer, false);
    while (lexer->lookahead != '$' && lexer->lookahead != '`' && lexer->lookahead != 0) {
      lexer->advance(lexer, false);
    }
    if (lexer->lookahead == '$') {
      lexer->advance(lexer, false);
      if (lexer->lookahead == '{') {
        lexer->advance(lexer, false);
        lexer->result_symbol = TEMPLATE_LITERAL_START;
        return true;
      }
    }
    return false;
  }

  if (valid_symbols[TEMPLATE_LITERAL_END] && lexer->lookahead == '}') {
    lexer->advance(lexer, false);
    while (lexer->lookahead != '`' && lexer->lookahead != '$' && lexer->lookahead != 0) {
      lexer->advance(lexer, false);
    }
    if (lexer->lookahead == '`') {
      lexer->advance(lexer, false);
      lexer->result_symbol = TEMPLATE_LITERAL_END;
      return true;
    }
    return false;
  }

  if (valid_symbols[TEMPLATE_LITERAL_MIDDLE] && lexer->lookahead == '}') {
    lexer->advance(lexer, false);
    while (lexer->lookahead != '$' && lexer->lookahead != '`' && lexer->lookahead != 0) {
      lexer->advance(lexer, false);
    }
    if (lexer->lookahead == '$') {
      lexer->advance(lexer, false);
      if (lexer->lookahead == '{') {
        lexer->advance(lexer, false);
        lexer->result_symbol = TEMPLATE_LITERAL_MIDDLE;
        return true;
      }
    }
    return false;
  }

  return false;
}
