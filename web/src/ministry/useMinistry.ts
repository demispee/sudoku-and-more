// The state of the Ministry of Odd Forms and what the player can do
// (.openspec/specs/004-ministry-of-odd-forms). The rules are in Rust (game-core/src/ministry.rs).
import { ref } from "vue";
import { Ministry, formsPerDay, randomSeed } from "../wasm";

export const STAMP_TIME = 700; // ms the stamped form stays on the desk before the next one
export const TICK = 100; // ms between two ticks of the clock
export const HURRY = 3000; // ms left when the time bar turns red

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
  const stampMark = ref<"approved" | "rejected" | "expired" | null>(null); // the stamp on the form on the desk
  const message = ref("");
  /** The last strike came from the clock, not from a wrong stamp */
  const tooSlow = ref(false);
  /** The time for this form and how much is left, in ms */
  const timeLimit = ref(0);
  const timeLeft = ref(0);
  const memo = ref<string | null>(null); // the new rule, while the minister's memo is shown
  const fired = ref(false);
  const best = ref<Best | null>(JSON.parse(store.getItem("ministryBest") || "null"));
  let stampTimer: ReturnType<typeof setTimeout> | undefined;
  let clock: ReturnType<typeof setInterval> | undefined;

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
    timeLimit.value = timeLeft.value = game.secondsPerForm * 1000;
  }

  /** One tick: the clock stands still during a stamp, the memo, after being fired, and in a hidden tab */
  function tick() {
    const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    if (stampMark.value || memo.value || fired.value || hidden) return;
    timeLeft.value = Math.max(0, timeLeft.value - TICK);
    if (timeLeft.value === 0 && game.expire()) {
      tooSlow.value = true;
      message.value = "Too slow! The applicant left.";
      stampMark.value = "expired";
      strikes.value = game.strikes;
      afterStamp();
    }
  }

  function stamp(approve: boolean) {
    if (stampMark.value || memo.value || fired.value) return;
    const result = game.stamp(approve);
    if (!result) return;
    const { right, rule } = result;
    result.free();
    const book = game.rules();
    tooSlow.value = false;
    message.value = right ? ""
      : rule ? `Rule ${rule} says: ${book[rule - 1]}`
      : "No rule applies, so the form is approved.";
    stampMark.value = approve ? "approved" : "rejected";
    strikes.value = game.strikes;
    afterStamp();
  }

  /** The stamped form stays a moment; then the next form, the memo or the end */
  function afterStamp() {
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
    tooSlow.value = false;
    sync();
  }

  function start() {
    sync();
    clock = setInterval(tick, TICK);
  }

  function stop() {
    clearTimeout(stampTimer);
    clearInterval(clock);
    game.free();
  }

  return {
    // state
    form, rules, day, today, stamped, strikes, stampMark, message, tooSlow, memo, fired, best, FORMS_PER_DAY,
    timeLimit, timeLeft,
    // actions
    start, stop, stamp, nextDay, reapply,
    /** The stamp the rulebook asks for (for tests) */
    rightStamp: () => game.rightStamp(),
  };
}

export type MinistryGame = ReturnType<typeof useMinistry>;
