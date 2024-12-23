import XCTest
import SwiftTreeSitter
import TreeSitterInferScript

final class TreeSitterInferScriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_inferscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading InferScript grammar")
    }
}
