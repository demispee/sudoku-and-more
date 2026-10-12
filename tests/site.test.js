// Tests for .openspec/specs/000-site/spec.md
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const GAMES = ["sudoku.html", "spot-the-difference.html", "balls.html"];
const PAGES = ["index.html", ...GAMES];
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

describe("Requirement 1: pages and modules", () => {
  test.each(PAGES)("%s loads nothing from the internet", page => {
    const html = read(page);
    const refs = [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].map(m => m[1]);
    expect(refs.filter(ref => /^(https?:)?\/\//.test(ref))).toEqual([]);
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
    expect(html).not.toMatch(/<link[^>]*stylesheet/);
  });

  test.each(GAMES)("%s imports its rules from src/", page => {
    const html = read(page);
    expect(html).toContain('<script type="module">');
    expect(html).toMatch(/from "\.\/src\/[\w-]+\.js"/);
  });
});

describe("Requirement 2: start page", () => {
  test.each(GAMES)("links to %s", game => {
    expect(read("index.html")).toContain(`href="${game}"`);
  });
});

describe("Requirement 3: back to the start page", () => {
  test.each(GAMES)("%s has a back link", game => {
    expect(read(game)).toMatch(/<a class="back" href="index\.html">← back<\/a>/);
  });
});
