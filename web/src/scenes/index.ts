// The spot-the-difference scenes, drawn in code as SVG (ADR-0007: the drawings belong
// with the interface; the rules are in Rust). One file per scene; no DOM access, so they
// run in the browser and in Node.js (tests).
//
// Each scene has a name, a draw(has) function that returns the SVG markup (has(id) says
// whether difference `id` is shown), and its list of possible differences.
import { champagne } from "./champagne";
import { cocktails } from "./cocktails";
import { peacock } from "./peacock";
import { swan } from "./swan";
import type { Scene } from "./types";
import { vanity } from "./vanity";

export { seeded } from "./helpers";
export type { Difference, Has, Point, Scene } from "./types";

export const SCENES: Scene[] = [champagne, peacock, vanity, swan, cocktails];
