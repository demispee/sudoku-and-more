// The state of the Ministry of Odd Forms and what the player can do
// (.openspec/specs/004-ministry-of-odd-forms). The rules are in Rust (game-core/src/ministry.rs).
import { ref } from "vue";
import { Ministry, formsPerDay, randomSeed } from "../wasm";

export const STAMP_TIME = 700; // ms the stamped form stays on the desk before the next one

export interface Form {
  name: string;
  species: string;
  hat: boolean;
  number: number;
  weekday: string;
  doodle: string;
}

export interface Best {
  days: number;
  forms: number;
}

/** Where the page keeps the best result between visits */
export type Store = Pick<Storage, "getItem" | "setItem">;

export function useMinistry(store: Store = localStorage) {
  const FORMS_PER_DAY = formsPerDay();
  let game = new Ministry(randomSeed());

  const form = ref<Form>(readForm());
  const rules = ref<string[]>([]); // oldest first; rule 1 is the oldest
  const day = ref(1);
  const today = ref(0);
  const stamped = ref(0);
  const strikes = ref(0);
  const stampMark = ref<"approved" | "rejected" | null>(null); // the stamp on the form on the desk
  const message = ref("");
  const memo = ref<string | null>(null); // the new rule, while the minister's memo is shown
  const fired = ref(false);
  const best = ref<Best | null>(JSON.parse(store.getItem("ministryBest") || "null"));
  let stampTimer: ReturnType<typeof setTimeout> | undefined;

  function readForm(): Form {
    return {
      name: game.name, species: game.species, hat: game.hat, number: game.number, weekday: game.weekday,
      doodle: game.doodle,
    };
  }

  function sync() {
    form.value = readForm();
    rules.value = game.rules();
    day.value = game.day;
    today.value = game.today;
    stamped.value = game.stamped;
    strikes.value = game.strikes;
    fired.value = game.fired;
  }

  function stamp(approve: boolean) {
    if (stampMark.value || memo.value || fired.value) return;
    const result = game.stamp(approve);
    if (!result) return;
    const { right, rule } = result;
    result.free();
    const book = game.rules();
    message.value = right ? ""
      : rule ? `Rule ${rule} says: ${book[rule - 1]}`
      : "No rule applies, so the form is approved.";
    stampMark.value = approve ? "approved" : "rejected";
    strikes.value = game.strikes;
    // The stamped form stays a moment; then the next form, the memo or the end
    stampTimer = setTimeout(() => {
      stampMark.value = null;
      if (game.fired) return fire();
      if (game.dayOver) {
        game.nextDay();
        memo.value = game.rules().at(-1)!;
      }
      sync();
    }, STAMP_TIME);
  }

  function fire() {
    sync();
    const result = { days: day.value, forms: stamped.value };
    const b = best.value;
    if (!b || result.days > b.days || (result.days === b.days && result.forms > b.forms)) {
      best.value = result;
      store.setItem("ministryBest", JSON.stringify(result));
    }
  }

  function nextDay() {
    memo.value = null;
  }

  function reapply() {
    if (!fired.value) return;
    game.free();
    game = new Ministry(randomSeed());
    message.value = "";
    sync();
  }

  function start() {
    sync();
  }

  function stop() {
    clearTimeout(stampTimer);
    game.free();
  }

  return {
    // state
    form, rules, day, today, stamped, strikes, stampMark, message, memo, fired, best, FORMS_PER_DAY,
    // actions
    start, stop, stamp, nextDay, reapply,
    /** The stamp the rulebook asks for (for tests) */
    rightStamp: () => game.rightStamp(),
  };
}

export type MinistryGame = ReturnType<typeof useMinistry>;
