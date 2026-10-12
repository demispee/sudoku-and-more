// Puts the complete site in dist/ for GitHub Pages: the pages, the JavaScript in src/
// and the compiled WebAssembly. Run `npm run build:wasm` first (npm run build does).
// No bundling: the files are copied as they are (ADR-0006).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const PKG = "game-core/pkg";
for (const file of ["game_core.js", "game_core_bg.wasm"]) {
  if (!existsSync(`${PKG}/${file}`)) throw new Error(`${PKG}/${file} is missing; run npm run build:wasm`);
}

rmSync("dist", { recursive: true, force: true });
mkdirSync(`dist/${PKG}`, { recursive: true });
for (const page of readdirSync(".").filter(f => f.endsWith(".html"))) cpSync(page, `dist/${page}`);
cpSync("src", "dist/src", { recursive: true });
for (const file of ["game_core.js", "game_core_bg.wasm"]) cpSync(`${PKG}/${file}`, `dist/${PKG}/${file}`);
console.log("Site written to dist/");
