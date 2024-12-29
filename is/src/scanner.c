#include "../../common/scanner.include.c.h"

void *tree_sitter_inferscript_external_scanner_create(void) {
  return inferscript_common_create();
}

void tree_sitter_inferscript_external_scanner_destroy(void *payload) {
  inferscript_common_destroy(payload);
}

unsigned tree_sitter_inferscript_external_scanner_serialize(void *payload,
                                                            char *buffer) {
  return inferscript_common_serialize(payload, buffer);
}

void tree_sitter_inferscript_external_scanner_deserialize(void *payload,
                                                          const char *buffer,
                                                          unsigned length) {
  inferscript_common_deserialize(payload, buffer, length);
}

bool tree_sitter_inferscript_external_scanner_scan(void *payload,
                                                   TSLexer *lexer,
                                                   const bool *valid_symbols) {
  return inferscript_common_scan(payload, lexer, valid_symbols);
}
