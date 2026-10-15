// The Flying Schubert landscapes, in the order Schubert flies through them
// (.openspec/specs/008-flying-schubert, Requirement 7)
import { city } from "./city";
import { datacentre } from "./datacentre";
import { meadow } from "./meadow";
import { mountains } from "./mountains";
import type { Landscape } from "./types";

export type { Landscape } from "./types";

export const LANDSCAPES: Landscape[] = [meadow, mountains, city, datacentre];
