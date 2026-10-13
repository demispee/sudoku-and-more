---
domain: sudoku
version: 2.2.0
status: accepted
date: 2026-10-12
---

# 001 — Sudoku

A sudoku with difficulty levels 1 to 10, notes, and a solver that fills in one number at a
time and explains why.

---

### Requirement 1: Valid puzzles [MUST]

Every puzzle MUST have exactly one solution. A puzzle MUST have at most 42 given numbers.

**Implementation:** `game-core/src/sudoku.rs::attempt()`, `solve()`

#### Scenario: New puzzle

- GIVEN any difficulty level
- WHEN a new puzzle is generated
- THEN it has one unique solution and at most 42 givens

**Tests:** `game-core/src/sudoku.rs` (the `requirement_1_…` tests); `tests/wasm.test.ts` for the bridge

---

### Requirement 2: Difficulty levels 1 to 10 [MUST]

The player MUST be able to choose a level from 1 to 10. The level MUST follow from the
hardest technique a person needs to solve the puzzle (ADR-0003):

| Level | What it takes |
|-------|---------------|
| 1–3 | Naked and hidden singles only; fewer givens means a higher level (more than 34, more than 30, otherwise) |
| 4 | Locked candidates (pointing pairs) |
| 5 | Naked or hidden pairs |
| 6 | Triples, X-Wing, XY-Wing or Swordfish |
| 7–10 | More than these techniques; the more cells still empty when they run out, the harder (fewer than 30, 38, 46, otherwise) |

The generator SHOULD find a puzzle of exactly the chosen level. If it has not found one
after 8 seconds, it MUST use the closest level it found, and the level label MUST show the
actual level.

**Implementation:** `game-core/src/sudoku.rs::TECHNIQUES`, `rate()`, `level_of()`; `web/src/sudoku/useSudoku.ts::startJob()`

#### Scenario: Choosing a level

- GIVEN the player chooses level 5
- WHEN the puzzle is ready
- THEN the label reads `level \ 5` and the puzzle needs pairs but nothing harder

**Tests:** `game-core/src/sudoku.rs` (the `requirement_2_…` tests); `tests/use-sudoku.test.ts` ("Requirement 2"); `tests/sudoku-page.test.ts` ("Requirement 2 and 10"); `tests/wasm.test.ts` for the bridge

---

### Requirement 3: Responsive generation [MUST]

Generating MUST NOT freeze the page. While the player solves a puzzle, the next one of the
same level MUST be prepared in the background. If the player has to wait, a loader with
`building a level N puzzle` MUST be shown.

**Implementation:** `web/src/sudoku/useSudoku.ts::startJob()`, `newGame()`; `web/src/sudoku/SudokuBoard.vue` (the loader)

#### Scenario: Next puzzle

- GIVEN a puzzle has been solved
- WHEN the next puzzle starts
- THEN it usually appears at once, because it was prepared in the background

**Tests:** `tests/use-sudoku.test.ts` ("Requirement 3")

**Check:** on level 9, the page stays responsive while the loader shows.

---

### Requirement 4: Entering numbers [MUST]

The player MUST be able to select a cell by clicking it or with the arrow keys, and enter
1–9 with the keyboard or the number pad. Given numbers MUST NOT be editable. Entering the
number a cell already holds MUST clear it. A wrong number MUST be shown in magenta.
Backspace, Delete, 0 and `erase` MUST clear the selected cell. Keys pressed with Ctrl, Cmd
or Alt, and keys typed in the level list, MUST be left to the browser; holding `S` MUST take
one step, not many.

When a correct number is placed, that number MUST be removed from the notes of every cell
in the same row, column and box.

**Implementation:** `web/src/sudoku/useSudoku.ts::select()`, `move()`, `enter()`, `erase()`; `game-core/src/sudoku.rs::clear_notes_around()`; `web/src/pages/SudokuPage.vue::onKey()`, `web/src/sudoku/NumberPad.vue`

#### Scenario: A wrong number

- GIVEN an empty cell whose answer is 4
- WHEN the player enters 7
- THEN the 7 is shown in magenta

**Tests:** `game-core/src/sudoku.rs` (the `requirement_4_…` tests); `tests/use-sudoku.test.ts` ("Requirement 4"); `tests/sudoku-page.test.ts` ("Requirement 4"); `tests/wasm.test.ts` for the bridge

---

### Requirement 5: Notes [MUST]

With notes mode on (`notes` button or key `N`), entering a number MUST toggle it as a small
note in the cell instead of filling the cell. Notes MUST only be added to empty cells.

**Implementation:** `web/src/sudoku/useSudoku.ts::enter()`, `toggleNotes()`; `web/src/sudoku/SudokuBoard.vue`

#### Scenario: Toggling a note

- GIVEN notes mode is on and an empty cell is selected
- WHEN the player presses 3 twice
- THEN the note 3 appears and disappears again

**Tests:** `tests/use-sudoku.test.ts` ("Requirement 5"); `tests/sudoku-page.test.ts` ("Requirement 5")

---

### Requirement 6: Hint [REMOVED]

Removed in 2.0.0: `step` (Requirement 7) does the same and explains why. The number is
kept so that the other requirements keep theirs.

---

### Requirement 7: Step solver [MUST]

`step` (key `S`) MUST fill in one correct number, explain it in the message box, and
count as a hint. In order:

1. If there is a wrong number, correct it: the selected cell first, if it is wrong.
2. Otherwise, work out all the options of every empty cell itself, without showing them
   or using the player's notes, and apply the easiest techniques until one cell has only
   one number left. Fill in that number. The message MUST name only the techniques that
   number needed, and the cells of those techniques MUST be highlighted.
3. If no technique gets that far, try a cell with two options: assume the wrong one and
   follow the singles. If that leads to a contradiction within 8 numbers, fill in the
   other option and show the reasoning, choosing the shortest contradiction. If none is
   found, fill in the empty cell with the fewest options and say that no technique gets
   further.

The player's notes MUST only lose numbers, never gain them: every note those techniques
ruled out MUST be crossed out, and the filled-in number MUST be removed from the notes
around it (as in Requirement 4).

**Implementation:** `game-core/src/sudoku.rs::solver_step()`, `next_step()`, `trial()`; `web/src/sudoku/useSudoku.ts::takeStep()`

#### Scenario: A step without notes

- GIVEN a new puzzle without any notes
- WHEN the player presses `step`
- THEN one number is filled in, the message says why, and no notes appear

#### Scenario: A step where the techniques run out

- GIVEN a puzzle where no technique fills in a number, and a cell that is a 3 or a 5
- WHEN the player presses `step`
- THEN the message says that if it were a 5, the singles would lead to a contradiction,
  and the 3 is filled in

#### Scenario: A step that needs an X-Wing

- GIVEN the player's notes, and a cell that only gets one number left after an X-Wing on 7
- WHEN the player presses `step`
- THEN that number is filled in, the message names the X-Wing, its cells are highlighted,
  and the 7s the X-Wing ruled out are crossed out of the player's notes

**Tests:** `game-core/src/sudoku.rs` (the `requirement_7_…` tests); `tests/use-sudoku.test.ts` ("Requirement 7"); `tests/sudoku-page.test.ts` ("Requirement 7"); `tests/wasm.test.ts` for the bridge

---

### Requirement 8: Auto-solve [MUST]

`solve` MUST run the step solver every 700 ms until the puzzle is solved; the button MUST
change to `stop` while it runs. Any input by the player MUST stop it. A puzzle finished by
auto-solve MUST NOT count as solved.

**Implementation:** `web/src/sudoku/useSudoku.ts::toggleAutoSolve()`, `stopAutoSolve()`, `checkSolved()`

#### Scenario: Letting the solver finish

- GIVEN a puzzle in progress
- WHEN the player presses `solve` and waits
- THEN the board fills step by step, the message says the solver finished, and the solved
  counter does not change

**Tests:** `tests/use-sudoku.test.ts` ("Requirement 8"); `tests/sudoku-page.test.ts` ("Requirement 8")

---

### Requirement 9: Solving a puzzle [MUST]

When the player completes the puzzle correctly, the board MUST lock and an overlay MUST
show the time, the level and the number of hints. The solved counter MUST go up by one and
be saved in the browser. After 3 seconds a new puzzle of the same level MUST start.
`skip` MUST start a new puzzle at any time.

**Implementation:** `web/src/sudoku/useSudoku.ts::checkSolved()`, `newGame()`; `web/src/sudoku/SudokuBoard.vue` (the result)

#### Scenario: Completed

- GIVEN one empty cell left
- WHEN the player fills in the correct number
- THEN the overlay shows `Solved in m:ss`, and 3 seconds later a new puzzle starts

**Tests:** `tests/use-sudoku.test.ts` ("Requirement 9"); `tests/sudoku-page.test.ts` ("Requirement 9")

---

### Requirement 10: Remembered between visits [SHOULD]

The chosen level and the number of solved puzzles SHOULD be remembered in the browser
(`localStorage` keys `sudokuLevel` and `sudokuSolved`). The default level is 5.

**Implementation:** `web/src/sudoku/useSudoku.ts::useSudoku()`, `setLevel()`

#### Scenario: Coming back

- GIVEN the player chose level 8 and solved 3 puzzles
- WHEN they reload the page
- THEN level 8 is selected and the counter reads 3

**Tests:** `tests/use-sudoku.test.ts` ("Requirement 10"); `tests/sudoku-page.test.ts` ("Requirement 2 and 10")
