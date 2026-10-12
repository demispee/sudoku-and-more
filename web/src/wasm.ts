// The game rules in Rust, compiled to WebAssembly (game-core/, ADR-0006). Pages wait for
// loadWasm() before they mount; tests pass the module's bytes, because Node.js can't
// fetch it by URL.
import init from "../../game-core/pkg/game_core.js";

export * from "../../game-core/pkg/game_core.js";

let loading: ReturnType<typeof init> | undefined;

export function loadWasm(source?: Parameters<typeof init>[0]): ReturnType<typeof init> {
  loading ??= init(source);
  return loading;
}

/** A random 32-bit seed for the Rust random generator */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
