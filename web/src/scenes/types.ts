// Types shared by the spot-the-difference scenes

export type Point = [number, number];

/** Whether the difference with this id is shown in the picture */
export type Has = (id: string) => boolean;

/** Where a difference is: a circle around (x, y) with radius r */
export interface Difference {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface Scene {
  name: string;
  draw: (has: Has) => string;
  differences: Difference[];
}
