---
domain: ministry-of-odd-forms
version: 1.2.0
status: accepted
date: 2026-10-13
---

# 004 — The Ministry of Odd Forms

You are a clerk at an absurd ministry. Application forms arrive one at a time, and you
stamp each one APPROVED or REJECTED by the rulebook, which gets stranger every day.

---

### Requirement 1: Forms [MUST]

Every form MUST show one applicant with:
- a name, from a fixed list of at least 30 odd names;
- a species: penguin, goose, cat, badger, octopus, llama, snail or owl;
- a hat or no hat;
- a favourite number from 1 to 20;
- the day of the week the form was filed;
- a doodle in red, blue, green or yellow.

Forms MUST be made by the Rust core from a seed, so the same seed gives the same forms.
At least half of the forms of a day MUST match one or more rules in the rulebook, so the
rules come up often.

**Implementation:** `game-core/src/ministry.rs`

#### Scenario: Repeatable forms

- GIVEN two games started with the same seed
- THEN they show the same forms in the same order

---

### Requirement 2: The rulebook [MUST]

There MUST be a pool of at least 16 rules. Each rule has a condition on the form's
fields and a verdict: approve, reject, or "do the opposite". Examples:
- "Reject anyone wearing a hat."
- "Penguins are always approved."
- "Names with a double letter are rejected."
- "If the favourite number is 7, do the opposite."

The game MUST start with one rule, "Reject anyone wearing a hat."; each new day MUST add
one rule from the pool that is not in the book yet. Once every rule is in the book, a new
day adds none, and the memo MUST say "No new rules today." The rulebook MUST always be visible, newest rule on top, numbered.

The right stamp for a form MUST be decided like this:
1. Go through the rules from newest to oldest; the first rule whose condition matches
   decides.
2. If that rule says "do the opposite", the answer is the opposite of what the older
   rules (below it) decide.
3. If no rule matches, the form is approved.

**Implementation:** `game-core/src/ministry.rs`

#### Scenario: A newer rule wins

- GIVEN rule 1 "Reject anyone wearing a hat" and rule 2 "Penguins are always approved"
- WHEN a penguin with a hat applies
- THEN the right stamp is APPROVED, because rule 2 is newer

#### Scenario: Doing the opposite

- GIVEN rule 1 "Reject anyone wearing a hat" and rule 2 "If the favourite number is 7,
  do the opposite"
- WHEN a cat with a hat and favourite number 7 applies
- THEN the right stamp is APPROVED

---

### Requirement 3: Stamping [MUST]

The player MUST stamp with the `approve` and `reject` buttons or the keys `A` and `R`.
- A right stamp MUST show the stamp on the form and count one stamped form.
- A wrong stamp MUST leave a tea stain on the desk, count a strike, and say what the
  right stamp was and which rule decided, for example "Should have been APPROVED. Rule 2
  says: Penguins are always approved." When no rule applies: "Should have been APPROVED:
  no rule applies."
- Only `A`, `R` and the two buttons stamp. Enter MUST NOT stamp a form, also not when a
  stamp button still has the keyboard focus after a click.

Then the next form MUST appear.

**Implementation:** `web/src/pages/MinistryPage.vue`, `web/src/ministry/useMinistry.ts`

#### Scenario: A wrong stamp

- GIVEN rule 1 "Penguins are always approved"
- WHEN the player rejects a penguin
- THEN a tea stain appears, the strikes go to 1, and the message says "Should have been
  APPROVED. Rule 1 says: Penguins are always approved."

#### Scenario: Enter after clicking a stamp

- GIVEN the player clicked `approve` on the last form of a day
- WHEN they press Enter to close the memo
- THEN the next day starts, and its first form is not stamped

---

### Requirement 4: Days [MUST]

A working day MUST be 10 forms. After the 10th form, a memo from the minister MUST show
the new rule; the next day starts when the player presses `next day` or Enter. The page
MUST show the day, the forms stamped and the strikes.

**Implementation:** `web/src/ministry/useMinistry.ts`

#### Scenario: A new day

- GIVEN the 10th form of day 1 is stamped
- THEN a memo shows the new rule, and after `next day` the rulebook has 2 rules

---

### Requirement 5: Fired [MUST]

After 3 strikes (over all days, not per day; a form that runs out of time counts too, see
Requirement 7), the player MUST be fired: an overlay says
how many days they lasted and how many forms they stamped right, and `reapply` (or Enter)
starts a new game with a new seed.

**Implementation:** `web/src/ministry/useMinistry.ts`

#### Scenario: The third strike

- GIVEN 2 strikes
- WHEN the player stamps a form wrong
- THEN the overlay says "You're fired" with the days and forms, and stamping does nothing
  until `reapply`

---

### Requirement 6: Remembered between visits [SHOULD]

The best result (most days, then most forms) SHOULD be kept in the browser
(`localStorage` key `ministryBest`) and shown on the page. A saved value that can't be
read MUST be ignored, not break the page.

**Implementation:** `web/src/ministry/useMinistry.ts`

---

### Requirement 7: Time per form [MUST]

Every form MUST have a time limit: 12 seconds on day 1, 1 second less every day, and never
less than 7 seconds. The clock MUST count the time that really passed, also when the
browser runs it late. A bar along the form MUST show the time left; in the last 3 seconds it
MUST turn red. When the time runs out, the form MUST get an EXPIRED stamp, count as a
strike, and the page MUST say "Too slow! The applicant left."; then the next form appears.
The clock MUST stand still while the minister's memo is shown, after being fired, and
while the page is hidden (another tab).

**Implementation:** `game-core/src/ministry.rs` (the limit per day, a form that runs out);
`web/src/ministry/useMinistry.ts` (the clock); `web/src/pages/MinistryPage.vue` (the bar)

#### Scenario: Too slow

- GIVEN day 1 and a new form
- WHEN the player waits 12 seconds without stamping
- THEN the form is stamped EXPIRED, the strikes go up by 1, and the next form appears

#### Scenario: Less time every day

- GIVEN day 4
- THEN every form has 9 seconds; on day 6 and later, 7 seconds
