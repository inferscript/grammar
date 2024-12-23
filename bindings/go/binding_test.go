package tree_sitter_inferscript_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_inferscript "github.com/inferscript/grammar/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_inferscript.Language())
	if language == nil {
		t.Errorf("Error loading InferScript grammar")
	}
}
