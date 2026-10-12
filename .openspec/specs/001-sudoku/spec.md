---
domain: sudoku
version: 1.1.0
status: accepted
date: 2026-10-09
---

# 001 — Sudoku

A sudoku with difficulty levels 1 to 10, notes, hints, and a solver that explains every
step it takes.

---

### Requirement 1: Valid puzzles [MUST]

Every puzzle MUST have exactly one solution. A puzzle MUST have at most 42 given numbers.

**Implementation:** `src/sudoku.js::attempt()`, `solve()`

#### Scenario: New puzzle

- GIVEN any difficulty level
- WHEN a new puzzle is generated
- THEN it has one unique solution and at most 42 givens

**Tests:** `tests/sudoku.test.js` ("Requirement 1")

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

**Implementation:** `src/sudoku.js::TECHNIQUES`, `rate()`, `levelOf()`; `sudoku.html::startJob()`

#### Scenario: Choosing a level

- GIVEN the player chooses level 5
- WHEN the puzzle is ready
- THEN the label reads `level \ 5` and the puzzle needs pairs but nothing harder

**Tests:** `tests/sudoku.test.js` ("Requirement 2")

---

### Requirement 3: Responsive generation [MUST]

Generating MUST NOT freeze the page. While the player solves a puzzle, the next one of the
same level MUST be prepared in the background. If the player has to wait, a loader with
`building a level N puzzle` MUST be shown.

**Implementation:** `sudoku.html::startJob()`, `newGame()`

#### Scenario: Next puzzle

- GIVEN a puzzle has been solved
- WHEN the next puzzle starts
- THEN it usually appears at once, because it was prepared in the background

**Check:** choose level 9 and watch the loader; the page stays responsive.

---

### Requirement 4: Entering numbers [MUST]

The player MUST be able to select a cell by clicking it or with the arrow keys, and enter
1–9 with the keyboard or the number pad. Given numbers MUST NOT be editable. Entering the
number a cell already holds MUST clear it. A wrong number MUST be shown in magenta.
Backspace, Delete, 0 and `erase` MUST clear the selected cell.

When a correct number is placed, that number MUST be removed from the notes of every cell
in the same row, column and box.

**Implementation:** `sudoku.html::select()`, `enter()`, `erase()`; `src/sudoku.js::clearNotesAround()`

#### Scenario: A wrong number

- GIVEN an empty cell whose answer is 4
- WHEN the player enters 7
- THEN the 7 is shown in magenta

**Tests:** `tests/sudoku.test.js` ("Requirement 4")

**Check:** typing, the pad and erase are checked by hand.

---

### Requirement 5: Notes [MUST]

With notes mode on (`notes` button or key `N`), entering a number MUST toggle it as a small
note in the cell instead of filling the cell. Notes MUST only be added to empty cells.

**Implementation:** `sudoku.html::enter()`, `render()`

#### Scenario: Toggling a note

- GIVEN notes mode is on and an empty cell is selected
- WHEN the player presses 3 twice
- THEN the note 3 appears and disappears again

**Check:** turn notes on and toggle a few numbers.

---

### Requirement 6: Hint [MUST]

`hint` (key `T`) MUST fill in one correct number, explain it, and count as a hint:

1. If there is a wrong number, it MUST correct that one first (the selected one if it is
   wrong).
2. Otherwise, if an empty cell is selected, it MUST fill that cell.
3. Otherwise it MUST fill the empty cell with the fewest options.

**Implementation:** `src/sudoku.js::chooseHint()`; `sudoku.html::hint()`

#### Scenario: Mistake on the board

- GIVEN the board has a wrong number
- WHEN the player presses `hint`
- THEN that number is corrected and the message says it was wrong

**Tests:** `tests/sudoku.test.js` ("Requirement 6")

---

### Requirement 7: Step solver [MUST]

`step` (key `S`) MUST take one logical step and explain it in the message box, naming the
technique. It MUST work on the player's notes and highlight the cells involved. In order:

1. Correct a wrong number, if any.
2. If an empty cell has no notes, fill in all possible notes first.
3. Restore a correct number that was crossed out of the notes.
4. Apply the easiest technique that makes progress.
5. If no technique applies, fill in one cell and say that it needs chains or trial and
   error.

Every step except filling in notes MUST count as a hint.

**Implementation:** `src/sudoku.js::solverStep()`, `nextStep()`; `sudoku.html::showStep()`

#### Scenario: Following the solver

- GIVEN a puzzle with notes filled in
- WHEN the player presses `step`
- THEN one technique is applied, the message names it, and the affected cells are
  highlighted

**Tests:** `tests/sudoku.test.js` ("Requirement 7")

---

### Requirement 8: Auto-solve [MUST]

`solve` MUST run the step solver every 700 ms until the puzzle is solved; the button MUST
change to `stop` while it runs. Any input by the player MUST stop it. A puzzle finished by
auto-solve MUST NOT count as solved.

**Implementation:** `sudoku.html::toggleAutoSolve()`, `stopAutoSolve()`, `checkSolved()`

#### Scenario: Letting the solver finish

- GIVEN a puzzle in progress
- WHEN the player presses `solve` and waits
- THEN the board fills step by step, the message says the solver finished, and the solved
  counter does not change

**Check:** press `solve`, wait, and see the solved counter stay the same.

---

### Requirement 9: Solving a puzzle [MUST]

When the player completes the puzzle correctly, the board MUST lock and an overlay MUST
show the time, the level and the number of hints. The solved counter MUST go up by one and
be saved in the browser. After 3 seconds a new puzzle of the same level MUST start.
`skip` MUST start a new puzzle at any time.

**Implementation:** `sudoku.html::checkSolved()`, `newGame()`

#### Scenario: Completed

- GIVEN one empty cell left
- WHEN the player fills in the correct number
- THEN the overlay shows `Solved in m:ss`, and 3 seconds later a new puzzle starts

**Check:** finish a puzzle (level 1 is quick).

---

### Requirement 10: Remembered between visits [SHOULD]

The chosen level and the number of solved puzzles SHOULD be remembered in the browser
(`localStorage` keys `sudokuLevel` and `sudokuSolved`). The default level is 5.

**Implementation:** `sudoku.html` controls section

#### Scenario: Coming back

- GIVEN the player chose level 8 and solved 3 puzzles
- WHEN they reload the page
- THEN level 8 is selected and the counter reads 3

**Check:** change the level, reload the page.
