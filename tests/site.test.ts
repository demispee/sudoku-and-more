// Tests for .openspec/specs/000-site/spec.md
// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, test } from "vitest";
import BackLink from "../web/src/components/BackLink.vue";
import SiteFooter from "../web/src/components/SiteFooter.vue";
import IndexPage from "../web/src/pages/IndexPage.vue";

const GAMES = ["sudoku.html", "spot-the-difference.html", "balls.html", "ministry.html", "shy-squares.html", "mastermind.html", "flying-schubert.html"];
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

  test.each(["index", ...GAMES.map(g => g.replace(".html", ""))])("web/%s.html only mounts its Vue page", page => {
    const entry = read(`web/${page}.html`);
    expect(entry).toContain('<div id="app"></div>');
    expect(entry).toMatch(/<script type="module" src="\.\/src\/main-[\w-]+\.ts"><\/script>/);
    expect(entry).not.toContain("<style>");
  });

  test("the pages get their rules only from the WebAssembly module", () => {
    expect(read("web/src/wasm.ts")).toContain('from "../../game-core/pkg/game_core.js"');
    for (const file of [...filesIn("web/src", ".vue"), ...filesIn("web/src", ".ts")].filter(f => f !== "web/src/wasm.ts")) {
      expect(read(file)).not.toContain("game-core/pkg");
    }
  });
});

describe("Requirement 2: start page", () => {
  test("links to every game, with its name and a description", () => {
    const links = mount(IndexPage).findAll("a.game");
    expect(links.map(a => a.attributes("href"))).toEqual(GAMES);
    expect(links.map(a => a.find("strong").text())).toEqual(["Sudoku", "Spot the difference", "Bouncing balls", "The Ministry of Odd Forms", "Shy Schuberts", "Mastermind", "Flying Schubert"]);
    links.forEach(a => expect(a.find("span").text().length).toBeGreaterThan(10));
  });

  test("the shy Schuberts page keeps its address and has its new title", () => {
    expect(read("web/shy-squares.html")).toContain("<title>Shy Schuberts \\ LAB271</title>");
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

  test.each(["SudokuPage.vue", "SpotPage.vue", "BallsPage.vue", "MinistryPage.vue", "ShyPage.vue", "MastermindPage.vue", "FlyingPage.vue"])("%s shows the back link", page => {
    expect(read(`web/src/pages/${page}`)).toContain("<BackLink />");
  });
});
