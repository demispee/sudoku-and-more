// The spot-the-difference scenes, drawn in code as SVG (ADR-0007: the drawings belong
// with the interface; the rules are in Rust). One file per scene; no DOM access, so they
// run in the browser and in Node.js (tests).
//
// Each scene has a name, a draw(has) function that returns the SVG markup (has(id) says
// whether difference `id` is shown), and its list of possible differences.
import { bakery } from "./bakery";
import { beach } from "./beach";
import { champagne } from "./champagne";
import { city } from "./city";
import { cocktails } from "./cocktails";
import { coral } from "./coral";
import { farm } from "./farm";
import { forest } from "./forest";
import { garden } from "./garden";
import { peacock } from "./peacock";
import { space } from "./space";
import { swan } from "./swan";
import { vanity } from "./vanity";
import { winter } from "./winter";
import type { Scene } from "./types";

export { seeded } from "./helpers";
export type { Difference, Has, Point, Scene } from "./types";

export const SCENES: Scene[] = [
  champagne, peacock, vanity, swan, cocktails,
  coral, space, bakery, forest, city, beach, winter, farm, garden,
];
