//! The Ministry of Odd Forms: application forms, a rulebook that grows every day, and the
//! stamp each form should get. See `.openspec/specs/004-ministry-of-odd-forms/spec.md`.

use crate::random::Rng;

pub const FORMS_PER_DAY: u32 = 10;
pub const STRIKES_TO_BE_FIRED: u32 = 3;
/// Seconds per form on day 1; one less every day, down to `FEWEST_SECONDS`
pub const FIRST_DAY_SECONDS: u32 = 12;
pub const FEWEST_SECONDS: u32 = 5;

pub const NAMES: [&str; 32] = [
    "Bartholomew Puddle",
    "Gertrude Wobble",
    "Percival Snoot",
    "Cornelius Bobbin",
    "Ottoline Fudge",
    "Lavinia Crumpet",
    "Sebastian Toffee",
    "Mildred Hubbard",
    "Barnaby Gristle",
    "Clementine Marrow",
    "Ophelia Wiggles",
    "Leopold Pennywhistle",
    "Gwendolyn Spork",
    "Cuthbert Muddle",
    "Prudence Gribble",
    "Bertram Noodle",
    "Lucinda Parsnip",
    "Oswald Kettle",
    "Seraphina Doodle",
    "Archibald Quibble",
    "Winifred Sprout",
    "Ignatius Pickle",
    "Philippa Brambles",
    "Ambrose Dumpling",
    "Rosalind Mumble",
    "Thaddeus Waffle",
    "Henrietta Biscuit",
    "Montgomery Fizz",
    "Dorothea Plum",
    "Fitzgerald Nibble",
    "Agatha Wimple",
    "Eustace Boggs",
];
pub const SPECIES: [&str; 8] = [
    "penguin", "goose", "cat", "badger", "octopus", "llama", "snail", "owl",
];
pub const WEEKDAYS: [&str; 7] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];
pub const DOODLES: [&str; 4] = ["red", "blue", "green", "yellow"];

const PENGUIN: usize = 0;
const GOOSE: usize = 1;
const CAT: usize = 2;
const BADGER: usize = 3;
const OCTOPUS: usize = 4;
const LLAMA: usize = 5;
const SNAIL: usize = 6;
const OWL: usize = 7;
const MONDAY: usize = 0;
const WEDNESDAY: usize = 2;
const FRIDAY: usize = 4;
const RED: usize = 0;
const BLUE: usize = 1;
const GREEN: usize = 2;

/// One application form; the fields are indexes into the lists above
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Form {
    pub name: usize,
    pub species: usize,
    pub hat: bool,
    /// 1 to 20
    pub number: u8,
    pub weekday: usize,
    pub doodle: usize,
}

impl Form {
    fn random(rng: &mut Rng) -> Form {
        Form {
            name: rng.below(NAMES.len()),
            species: rng.below(SPECIES.len()),
            hat: rng.below(2) == 1,
            number: rng.below(20) as u8 + 1,
            weekday: rng.below(WEEKDAYS.len()),
            doodle: rng.below(DOODLES.len()),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Verdict {
    Approve,
    Reject,
    /// The opposite of what the older rules decide
    Opposite,
}

pub struct Rule {
    pub text: &'static str,
    pub verdict: Verdict,
    pub applies: fn(&Form) -> bool,
}

fn has_double_letter(name: &str) -> bool {
    let letters: Vec<char> = name.to_lowercase().chars().collect();
    letters
        .windows(2)
        .any(|w| w[0] == w[1] && w[0].is_alphabetic())
}

pub const RULES: [Rule; 19] = [
    Rule {
        text: "Reject anyone wearing a hat.",
        verdict: Verdict::Reject,
        applies: |f| f.hat,
    },
    Rule {
        text: "Penguins are always approved.",
        verdict: Verdict::Approve,
        applies: |f| f.species == PENGUIN,
    },
    Rule {
        text: "Names with a double letter are rejected.",
        verdict: Verdict::Reject,
        applies: |f| has_double_letter(NAMES[f.name]),
    },
    Rule {
        text: "If the favourite number is 7, do the opposite.",
        verdict: Verdict::Opposite,
        applies: |f| f.number == 7,
    },
    Rule {
        text: "Geese are rejected at weekends.",
        verdict: Verdict::Reject,
        applies: |f| f.species == GOOSE && f.weekday >= 5,
    },
    Rule {
        text: "Red doodles are rejected.",
        verdict: Verdict::Reject,
        applies: |f| f.doodle == RED,
    },
    Rule {
        text: "Octopuses are rejected, except on Wednesdays.",
        verdict: Verdict::Reject,
        applies: |f| f.species == OCTOPUS && f.weekday != WEDNESDAY,
    },
    Rule {
        text: "Cats in hats are approved.",
        verdict: Verdict::Approve,
        applies: |f| f.species == CAT && f.hat,
    },
    Rule {
        text: "Reject anyone whose name starts with the same letter as their species.",
        verdict: Verdict::Reject,
        applies: |f| NAMES[f.name].starts_with(SPECIES[f.species].to_uppercase().get(..1).unwrap()),
    },
    Rule {
        text: "Snails are approved. They have waited long enough.",
        verdict: Verdict::Approve,
        applies: |f| f.species == SNAIL,
    },
    Rule {
        text: "Favourite numbers above 13 are rejected.",
        verdict: Verdict::Reject,
        applies: |f| f.number > 13,
    },
    Rule {
        text: "Llamas with a blue doodle are rejected.",
        verdict: Verdict::Reject,
        applies: |f| f.species == LLAMA && f.doodle == BLUE,
    },
    Rule {
        text: "On Fridays, do the opposite.",
        verdict: Verdict::Opposite,
        applies: |f| f.weekday == FRIDAY,
    },
    Rule {
        text: "Badgers are always rejected.",
        verdict: Verdict::Reject,
        applies: |f| f.species == BADGER,
    },
    Rule {
        text: "Owls without a hat are rejected. It is undignified.",
        verdict: Verdict::Reject,
        applies: |f| f.species == OWL && !f.hat,
    },
    Rule {
        text: "Even favourite numbers are approved.",
        verdict: Verdict::Approve,
        applies: |f| f.number % 2 == 0,
    },
    Rule {
        text: "On Mondays, reject everyone.",
        verdict: Verdict::Reject,
        applies: |f| f.weekday == MONDAY,
    },
    Rule {
        text: "Green doodles are approved. They are calming.",
        verdict: Verdict::Approve,
        applies: |f| f.doodle == GREEN,
    },
    Rule {
        text: "Names longer than 18 letters are approved, out of respect.",
        verdict: Verdict::Approve,
        applies: |f| NAMES[f.name].chars().filter(|c| c.is_alphabetic()).count() > 18,
    },
];

/// The right stamp for a form, and the rule that decided it
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Decision {
    pub approve: bool,
    /// Index into `book`, or None when no rule applies
    pub rule: Option<usize>,
}

/// Newest rule first: the first that applies decides. "Do the opposite" turns around what
/// the older rules decide. Without a matching rule, the form is approved.
pub fn decide(form: &Form, book: &[usize]) -> Decision {
    for k in (0..book.len()).rev() {
        let rule = &RULES[book[k]];
        if !(rule.applies)(form) {
            continue;
        }
        let approve = match rule.verdict {
            Verdict::Approve => true,
            Verdict::Reject => false,
            Verdict::Opposite => !decide(form, &book[..k]).approve,
        };
        return Decision {
            approve,
            rule: Some(k),
        };
    }
    Decision {
        approve: true,
        rule: None,
    }
}

/// What a stamp did
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Stamp {
    pub right: bool,
    pub decision: Decision,
}

/// One game: the rulebook, the form on the desk and the score
pub struct Ministry {
    rng: Rng,
    /// Indexes into RULES, oldest first
    pub book: Vec<usize>,
    pub day: u32,
    /// Forms stamped today
    pub today: u32,
    pub form: Form,
    /// Forms stamped right
    pub stamped: u32,
    pub strikes: u32,
}

impl Ministry {
    pub fn new(seed: u32) -> Ministry {
        let mut rng = Rng::new(seed);
        // Every game starts with the simplest rule, "Reject anyone wearing a hat."
        let book = vec![0];
        let form = Form::random(&mut rng);
        let mut game = Ministry {
            rng,
            book,
            day: 1,
            today: 0,
            form,
            stamped: 0,
            strikes: 0,
        };
        game.form = game.next_form();
        game
    }

    /// Every other form is made to match a rule in the book (the first of a day the
    /// newest), so at least half of a day's forms come under a rule
    fn next_form(&mut self) -> Form {
        if self.today % 2 == 1 {
            return Form::random(&mut self.rng);
        }
        let rule = if self.today == 0 {
            *self.book.last().expect("the book has a rule")
        } else {
            self.book[self.rng.below(self.book.len())]
        };
        loop {
            let form = Form::random(&mut self.rng);
            if (RULES[rule].applies)(&form) {
                return form;
            }
        }
    }

    pub fn fired(&self) -> bool {
        self.strikes >= STRIKES_TO_BE_FIRED
    }

    pub fn day_over(&self) -> bool {
        self.today == FORMS_PER_DAY
    }

    /// Stamps the form on the desk; the next form comes unless the day is over or the
    /// clerk is fired. Does nothing then.
    pub fn stamp(&mut self, approve: bool) -> Option<Stamp> {
        if self.fired() || self.day_over() {
            return None;
        }
        let decision = decide(&self.form, &self.book);
        let right = decision.approve == approve;
        if right {
            self.stamped += 1;
        } else {
            self.strikes += 1;
        }
        self.done_with_form();
        Some(Stamp { right, decision })
    }

    /// The time for a form today, in seconds
    pub fn seconds_per_form(&self) -> u32 {
        FIRST_DAY_SECONDS
            .saturating_sub(self.day - 1)
            .max(FEWEST_SECONDS)
    }

    /// The form on the desk ran out of time: a strike, and the next form. Returns false
    /// when there is no form to run out (the day is over or the clerk is fired).
    pub fn expire(&mut self) -> bool {
        if self.fired() || self.day_over() {
            return false;
        }
        self.strikes += 1;
        self.done_with_form();
        true
    }

    fn done_with_form(&mut self) {
        self.today += 1;
        if !self.fired() && !self.day_over() {
            self.form = self.next_form();
        }
    }

    /// Starts the next day with one new rule from the pool, once the day is over
    pub fn next_day(&mut self) {
        if !self.day_over() || self.fired() {
            return;
        }
        let unused: Vec<usize> = (0..RULES.len())
            .filter(|r| !self.book.contains(r))
            .collect();
        if !unused.is_empty() {
            self.book.push(unused[self.rng.below(unused.len())]);
        }
        self.day += 1;
        self.today = 0;
        self.form = self.next_form();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn form() -> Form {
        Form {
            name: 1, // Gertrude Wobble
            species: CAT,
            hat: false,
            number: 3,
            weekday: 1, // Tuesday
            doodle: 3,  // yellow
        }
    }

    fn rule(text: &str) -> usize {
        RULES.iter().position(|r| r.text == text).unwrap()
    }

    /// Plays the right stamp, or the wrong one
    fn play(game: &mut Ministry, right: bool) -> Stamp {
        let approve = decide(&game.form, &game.book).approve;
        game.stamp(if right { approve } else { !approve }).unwrap()
    }

    // ----- Requirement 1: forms -----

    #[test]
    fn requirement_1_forms_have_every_field_in_range() {
        assert!(NAMES.len() >= 30);
        let mut rng = Rng::new(4);
        for _ in 0..1000 {
            let f = Form::random(&mut rng);
            assert!(f.name < NAMES.len() && f.species < 8 && f.weekday < 7 && f.doodle < 4);
            assert!((1..=20).contains(&f.number));
        }
    }

    #[test]
    fn requirement_1_the_same_seed_gives_the_same_forms() {
        let (mut a, mut b) = (Ministry::new(9), Ministry::new(9));
        for _ in 0..FORMS_PER_DAY {
            assert_eq!(a.form, b.form);
            play(&mut a, true);
            play(&mut b, true);
        }
        assert_eq!(a.book, b.book);
    }

    #[test]
    fn requirement_1_at_least_half_of_a_day_comes_under_a_rule() {
        for seed in 0..100 {
            let mut game = Ministry::new(seed);
            for _ in 0..4 {
                let mut matched = 0;
                for _ in 0..FORMS_PER_DAY {
                    matched += decide(&game.form, &game.book).rule.is_some() as u32;
                    play(&mut game, true);
                }
                assert!(matched >= FORMS_PER_DAY / 2);
                game.next_day();
            }
        }
    }

    #[test]
    fn requirement_1_a_new_day_starts_with_a_form_for_the_new_rule() {
        let mut game = Ministry::new(3);
        for _ in 0..FORMS_PER_DAY {
            play(&mut game, true);
        }
        game.next_day();
        let newest = *game.book.last().unwrap();
        assert!((RULES[newest].applies)(&game.form));
    }

    // ----- Requirement 2: the rulebook -----

    #[test]
    fn requirement_2_the_pool_has_at_least_16_different_rules() {
        assert!(RULES.len() >= 16);
        let mut texts: Vec<&str> = RULES.iter().map(|r| r.text).collect();
        texts.sort();
        texts.dedup();
        assert_eq!(texts.len(), RULES.len());
    }

    #[test]
    fn requirement_2_every_rule_can_come_up() {
        let mut rng = Rng::new(1);
        let forms: Vec<Form> = (0..5000).map(|_| Form::random(&mut rng)).collect();
        for r in &RULES {
            assert!(forms.iter().any(|f| (r.applies)(f)), "{}", r.text);
            assert!(forms.iter().any(|f| !(r.applies)(f)), "{}", r.text);
        }
    }

    #[test]
    fn requirement_2_the_rules_check_what_they_say() {
        let f = form();
        let applies = |text: &str, f: Form| (RULES[rule(text)].applies)(&f);
        assert!(applies(
            "Reject anyone wearing a hat.",
            Form { hat: true, ..f }
        ));
        assert!(applies(
            "Names with a double letter are rejected.",
            Form { name: 0, ..f }
        )); // Puddle
        assert!(!applies(
            "Names with a double letter are rejected.",
            Form { name: 12, ..f }
        )); // Gwendolyn Spork
        assert!(applies(
            "Geese are rejected at weekends.",
            Form {
                species: GOOSE,
                weekday: 6,
                ..f
            }
        ));
        assert!(!applies(
            "Geese are rejected at weekends.",
            Form {
                species: GOOSE,
                weekday: 4,
                ..f
            }
        ));
        assert!(applies(
            "Octopuses are rejected, except on Wednesdays.",
            Form {
                species: OCTOPUS,
                ..f
            }
        ));
        assert!(!applies(
            "Octopuses are rejected, except on Wednesdays.",
            Form {
                species: OCTOPUS,
                weekday: WEDNESDAY,
                ..f
            }
        ));
        let same_letter = "Reject anyone whose name starts with the same letter as their species.";
        assert!(applies(
            same_letter,
            Form {
                name: 2,
                species: PENGUIN,
                ..f
            }
        )); // Percival, penguin
        assert!(!applies(
            same_letter,
            Form {
                name: 2,
                species: CAT,
                ..f
            }
        ));
        assert!(applies(
            "Favourite numbers above 13 are rejected.",
            Form { number: 14, ..f }
        ));
        assert!(!applies(
            "Favourite numbers above 13 are rejected.",
            Form { number: 13, ..f }
        ));
        assert!(applies(
            "Owls without a hat are rejected. It is undignified.",
            Form { species: OWL, ..f }
        ));
        assert!(applies(
            "Even favourite numbers are approved.",
            Form { number: 20, ..f }
        ));
        let long = "Names longer than 18 letters are approved, out of respect.";
        assert!(applies(long, Form { name: 11, ..f })); // Leopold Pennywhistle: 19 letters
        assert!(!applies(long, Form { name: 0, ..f })); // Bartholomew Puddle: 17
    }

    #[test]
    fn requirement_2_a_newer_rule_wins() {
        let book = [
            rule("Reject anyone wearing a hat."),
            rule("Penguins are always approved."),
        ];
        let penguin_in_hat = Form {
            species: PENGUIN,
            hat: true,
            ..form()
        };
        assert_eq!(
            decide(&penguin_in_hat, &book),
            Decision {
                approve: true,
                rule: Some(1)
            }
        );
        let cat_in_hat = Form {
            hat: true,
            ..form()
        };
        assert_eq!(
            decide(&cat_in_hat, &book),
            Decision {
                approve: false,
                rule: Some(0)
            }
        );
    }

    #[test]
    fn requirement_2_do_the_opposite_turns_the_older_rules_around() {
        let book = [
            rule("Reject anyone wearing a hat."),
            rule("If the favourite number is 7, do the opposite."),
        ];
        let seven_in_hat = Form {
            hat: true,
            number: 7,
            ..form()
        };
        assert_eq!(
            decide(&seven_in_hat, &book),
            Decision {
                approve: true,
                rule: Some(1)
            }
        );
        // Nothing older applies, so the opposite of "approved"
        let seven = Form {
            number: 7,
            ..form()
        };
        assert_eq!(
            decide(&seven, &book),
            Decision {
                approve: false,
                rule: Some(1)
            }
        );
    }

    #[test]
    fn requirement_2_without_a_matching_rule_the_form_is_approved() {
        let book = [rule("Badgers are always rejected.")];
        assert_eq!(
            decide(&form(), &book),
            Decision {
                approve: true,
                rule: None
            }
        );
    }

    #[test]
    fn requirement_2_the_game_starts_with_one_rule_and_adds_a_new_one_each_day() {
        let mut game = Ministry::new(5);
        assert_eq!(game.book, [rule("Reject anyone wearing a hat.")]);
        for day in 2..=RULES.len() as u32 + 2 {
            for _ in 0..FORMS_PER_DAY {
                play(&mut game, true);
            }
            game.next_day();
            assert_eq!(game.day, day);
            let mut unique = game.book.clone();
            unique.sort();
            unique.dedup();
            assert_eq!(unique.len(), game.book.len());
        }
        // Once the pool is used up, the book stays full
        assert_eq!(game.book.len(), RULES.len());
    }

    // ----- Requirements 3 to 5: stamping, days, fired -----

    #[test]
    fn requirement_3_a_right_stamp_counts_and_a_wrong_one_is_a_strike() {
        let mut game = Ministry::new(2);
        let first = game.form;
        let stamp = play(&mut game, true);
        assert!(stamp.right);
        assert_eq!((game.stamped, game.strikes, game.today), (1, 0, 1));
        assert_ne!(game.form, first);
        let stamp = play(&mut game, false);
        assert!(!stamp.right);
        assert_eq!((game.stamped, game.strikes, game.today), (1, 1, 2));
    }

    #[test]
    fn requirement_4_a_day_is_10_forms_and_waits_for_the_next_day() {
        let mut game = Ministry::new(6);
        for _ in 0..FORMS_PER_DAY {
            play(&mut game, true);
        }
        assert!(game.day_over());
        assert_eq!(game.stamp(true), None);
        game.next_day();
        assert_eq!((game.day, game.today, game.book.len()), (2, 0, 2));
        game.next_day(); // not over yet: nothing happens
        assert_eq!(game.day, 2);
    }

    #[test]
    fn requirement_5_three_strikes_over_the_days_and_you_are_fired() {
        let mut game = Ministry::new(8);
        play(&mut game, false);
        play(&mut game, false);
        for _ in 2..FORMS_PER_DAY {
            play(&mut game, true);
        }
        game.next_day();
        assert!(!game.fired());
        play(&mut game, false);
        assert!(game.fired());
        assert_eq!(game.stamp(true), None);
        assert_eq!((game.day, game.stamped, game.strikes), (2, 8, 3));
    }

    // ----- Requirement 7: time per form -----

    #[test]
    fn requirement_7_twelve_seconds_on_day_1_one_less_every_day_at_least_5() {
        let mut game = Ministry::new(2);
        let mut seconds = Vec::new();
        for _ in 0..9 {
            seconds.push(game.seconds_per_form());
            while !game.day_over() {
                let right = decide(&game.form, &game.book).approve;
                game.stamp(right);
            }
            game.next_day();
        }
        assert_eq!(seconds, vec![12, 11, 10, 9, 8, 7, 6, 5, 5]);
    }

    #[test]
    fn requirement_7_a_form_that_runs_out_is_a_strike_and_the_next_form_comes() {
        let mut game = Ministry::new(6);
        let first = game.form;
        assert!(game.expire());
        assert_eq!((game.strikes, game.today, game.stamped), (1, 1, 0));
        assert_ne!(game.form, first);
        assert!(game.expire());
        assert!(game.expire());
        assert!(game.fired());
        assert!(!game.expire());
        assert_eq!(game.strikes, 3);
    }

    #[test]
    fn requirement_7_nothing_runs_out_at_the_end_of_a_day() {
        let mut game = Ministry::new(6);
        while !game.day_over() {
            let right = decide(&game.form, &game.book).approve;
            game.stamp(right);
        }
        assert!(!game.expire());
        assert_eq!(game.strikes, 0);
    }
}
