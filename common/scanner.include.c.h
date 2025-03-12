#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  TEMPLATE_LITERAL_START_END,
  TEMPLATE_LITERAL_START,
  TEMPLATE_LITERAL_END,
  TEMPLATE_LITERAL_MIDDLE,
};

typedef struct {
  unsigned char template_depth;
  unsigned char expression_depth;
} ScannerState;

static inline void *inferscript_common_create(void) {
  ScannerState *state = calloc(1, sizeof(ScannerState));
  return state;
}

static inline void inferscript_common_destroy(void *payload) {
  free(payload);
}

static inline unsigned inferscript_common_serialize(void *payload, char *buffer) {
  ScannerState *state = (ScannerState *)payload;
  buffer[0] = state->template_depth;
  buffer[1] = state->expression_depth;
  return 2;
}

static inline void inferscript_common_deserialize(void *payload, const char *buffer, unsigned length) {
  if (length < 2) return;
  ScannerState *state = (ScannerState *)payload;
  state->template_depth = buffer[0];
  state->expression_depth = buffer[1];
}

static inline void skip_whitespace_and_comments(TSLexer *lexer) {
  while (true) {
    while (iswspace(lexer->lookahead)) {
      lexer->advance(lexer, true);
    }

    if (lexer->lookahead == '/') {
      lexer->advance(lexer, false);
      if (lexer->lookahead == '/') {
        while (lexer->lookahead != '\n' && lexer->lookahead != 0) {
          lexer->advance(lexer, false);
        }
        continue;
      } else if (lexer->lookahead == '*') {
        lexer->advance(lexer, false);
        while (true) {
          if (lexer->lookahead == 0) break;
          if (lexer->lookahead == '*') {
            lexer->advance(lexer, false);
            if (lexer->lookahead == '/') {
              lexer->advance(lexer, false);
              break;
            }
          } else {
            lexer->advance(lexer, false);
          }
        }
        continue;
      } else {
        lexer->mark_end(lexer);
        break;
      }
    } else {
      break;
    }
  }
}

static inline bool inferscript_common_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  ScannerState *state = (ScannerState *)payload;

  skip_whitespace_and_comments(lexer);

  // ========================
  // Outside of any template literal
  // ========================
  if (state->template_depth == 0) {
    if (lexer->lookahead == '`') {
      lexer->advance(lexer, false);
      state->template_depth = 1;  // Enter the first template literal

      // Check if it's TEMPLATE_LITERAL_START_END
      while (lexer->lookahead != '`' && lexer->lookahead != '$' && lexer->lookahead != 0) {
        lexer->advance(lexer, false);
      }

      if (lexer->lookahead == '`') {
        lexer->advance(lexer, false);
        state->template_depth--;
        lexer->result_symbol = TEMPLATE_LITERAL_START_END;
        return true;
      }

      if (lexer->lookahead == '$') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '{') {
          lexer->advance(lexer, false);
          state->expression_depth = 1;
          lexer->result_symbol = TEMPLATE_LITERAL_START;
          return true;
        }
      }

      return false;
    }

    return false;
  }

  // ========================
  // Inside a template literal
  // ========================
  if (state->template_depth > 0) {

    // ========================
    // Inside an expression `${ ... }`
    // ========================
    if (state->expression_depth > 0) {

      if (lexer->lookahead == '`') {
        lexer->advance(lexer, false);
        state->template_depth++;
        // No token emitted here. The parser will take care of nested templates.
        return false;
      }

      if (lexer->lookahead == '$') {
        lexer->advance(lexer, false);
        if (lexer->lookahead == '{') {
          lexer->advance(lexer, false);
          state->expression_depth++;
          return false;
        }
      }

      if (lexer->lookahead == '}') {
        lexer->advance(lexer, false);
        state->expression_depth--;

        if (state->expression_depth == 0) {
          // We are now back to template literal text
          // Start scanning for TEMPLATE_LITERAL_MIDDLE or TEMPLATE_LITERAL_END next loop
        }

        return false;
      }

      // Anything else inside the expression
      lexer->advance(lexer, false);
      return false;
    }

    // ========================
    // Template literal text scanning (expression_depth == 0)
    // ========================

    if (lexer->lookahead == '`') {
      lexer->advance(lexer, false);
      state->template_depth--;
      lexer->result_symbol = TEMPLATE_LITERAL_END;
      return true;
    }

    if (lexer->lookahead == '$') {
      lexer->advance(lexer, false);
      if (lexer->lookahead == '{') {
        lexer->advance(lexer, false);
        state->expression_depth = 1;
        lexer->result_symbol = TEMPLATE_LITERAL_MIDDLE;
        return true;
      }
    }

    if (lexer->lookahead == 0) {
      // Unexpected EOF
      return false;
    }

    // Consume literal text
    lexer->advance(lexer, false);
    return false;
  }

  // Should not reach here
  return false;
}
