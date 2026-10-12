// Tests for .openspec/specs/000-site/spec.md
// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import BackLink from "../web/src/components/BackLink.vue";
import SiteFooter from "../web/src/components/SiteFooter.vue";
import IndexPage from "../web/src/pages/IndexPage.vue";

const GAMES = ["sudoku.html", "spot-the-difference.html", "balls.html"];
// Paths from the project folder: in jsdom, URL is the browser's, which node:fs can't read
const read = (file: string) => readFileSync(resolve(file), "utf8");
const filesIn = (dir: string, ext: string): string[] =>
  readdirSync(resolve(dir), { withFileTypes: true }).flatMap((entry): string[] =>
    entry.isDirectory() ? filesIn(`${dir}/${entry.name}`, ext) : entry.name.endsWith(ext) ? [`${dir}/${entry.name}`] : []);

describe("Requirement 1: Vue pages, Rust core and no external resources", () => {
  test.each(["index.html", ...GAMES])("web/%s exists as the entry of its page", page => {
    expect(read(`web/${page}`)).toContain('<script type="module"');
  });

  test.each([...filesIn("web", ".html"), ...filesIn("web/src", ".vue")])("%s loads nothing from the internet", file => {
    const text = read(file);
    const refs = [...text.matchAll(/\b(?:src|href)="([^"]*)"/g)].map(m => m[1]!);
    expect(refs.filter(ref => /^(https?:)?\/\//.test(ref))).toEqual([]);
    expect(text).not.toMatch(/<link[^>]*stylesheet[^>]*https?:/);
  });

  test("the pages that are not in Vue yet import the WebAssembly module", () => {
    expect(read("web/spot-the-difference.html")).toContain('from "../game-core/pkg/game_core.js"');
  });
});

describe("Requirement 2: start page", () => {
  test("links to every game, with its name and a description", () => {
    const links = mount(IndexPage).findAll("a.game");
    expect(links.map(a => a.attributes("href"))).toEqual(GAMES);
    expect(links.map(a => a.find("strong").text())).toEqual(["Sudoku", "Spot the difference", "Bouncing balls"]);
    links.forEach(a => expect(a.find("span").text().length).toBeGreaterThan(10));
  });

  test("shows the footer", () => {
    expect(mount(IndexPage).findComponent(SiteFooter).exists()).toBe(true);
  });
});

describe("Requirement 3: back to the start page", () => {
  test("the back link goes to the start page", () => {
    const link = mount(BackLink).find("a");
    expect([link.attributes("href"), link.text()]).toEqual(["index.html", "← back"]);
  });

  test("spot the difference has a back link", () => {
    expect(read("web/spot-the-difference.html")).toMatch(/<a class="back" href="index\.html">← back<\/a>/);
  });

  test.each(["SudokuPage.vue", "BallsPage.vue"])("%s shows the back link", page => {
    expect(read(`web/src/pages/${page}`)).toContain("<BackLink />");
  });
});
