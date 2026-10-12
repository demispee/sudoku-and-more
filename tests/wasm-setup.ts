// Loads the real WebAssembly module for tests. Node.js can't fetch it by URL like a
// browser does, so the tests pass its bytes.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadWasm } from "../web/src/wasm";

export function loadWasmForTests() {
  // Paths from the project folder: in jsdom, URL is the browser's, which node:fs can't read
  const bytes = readFileSync(resolve("game-core/pkg/game_core_bg.wasm"));
  return loadWasm({ module_or_path: bytes });
}
