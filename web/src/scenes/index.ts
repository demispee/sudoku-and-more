// The spot-the-difference scenes, drawn in code as SVG (ADR-0007: the drawings belong
// with the interface; the rules are in Rust). One file per scene; no DOM access, so they
// run in the browser and in Node.js (tests).
//
// Each scene has a name, a draw(has) function that returns the SVG markup (has(id) says
// whether difference `id` is shown), and its list of possible differences.
import { aquarium } from "./aquarium";
import { arctic } from "./arctic";
import { bakery } from "./bakery";
import { balloons } from "./balloons";
import { beach } from "./beach";
import { champagne } from "./champagne";
import { city } from "./city";
import { cocktails } from "./cocktails";
import { coral } from "./coral";
import { desert } from "./desert";
import { farm } from "./farm";
import { forest } from "./forest";
import { garden } from "./garden";
import { haunted } from "./haunted";
import { japanese } from "./japanese";
import { jungle } from "./jungle";
import { kitchen } from "./kitchen";
import { lake } from "./lake";
import { market } from "./market";
import { music } from "./music";
import { peacock } from "./peacock";
import { picnic } from "./picnic";
import { pirate } from "./pirate";
import { reading } from "./reading";
import { space } from "./space";
import { swan } from "./swan";
import { toys } from "./toys";
import { train } from "./train";
import { vanity } from "./vanity";
import { winter } from "./winter";
import type { Scene } from "./types";

export { seeded } from "./helpers";
export type { Difference, Has, Point, Scene } from "./types";

export const SCENES: Scene[] = [
  champagne, peacock, vanity, swan, cocktails,
  coral, space, bakery, forest, city, beach, winter, farm, garden,
  desert, haunted, kitchen, music, train, lake, jungle, arctic,
  balloons, reading, picnic, aquarium, pirate, toys, japanese, market,
];
