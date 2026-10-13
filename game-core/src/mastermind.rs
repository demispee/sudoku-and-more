//! Mastermind: break a secret code of coloured pegs.
//! See `.openspec/specs/007-mastermind/spec.md`.

use crate::random::Rng;

pub const HOLES: usize = 4;
pub const COLOURS: u8 = 6;
pub const ROWS: usize = 10;

pub type Code = [u8; HOLES];

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Status {
    Playing,
    Won,
    Lost,
}

/// The answer pegs for a guess: (black, white)
pub fn score(code: &Code, guess: &Code) -> (u8, u8) {
    let black = (0..HOLES).filter(|&i| code[i] == guess[i]).count();
    // Every colour counts as often as it is in both, at most once per peg of the code
    let same: usize = (0..COLOURS)
        .map(|c| {
            let in_code = code.iter().filter(|&&p| p == c).count();
            let in_guess = guess.iter().filter(|&&p| p == c).count();
            in_code.min(in_guess)
        })
        .sum();
    (black as u8, (same - black) as u8)
}

pub struct Game {
    pub code: Code,
    /// Every checked row with its answer pegs
    pub rows: Vec<(Code, (u8, u8))>,
    pub status: Status,
}

impl Game {
    pub fn new(seed: u32) -> Game {
        let mut rng = Rng::new(seed);
        let mut code = [0; HOLES];
        for peg in &mut code {
            *peg = rng.below(COLOURS as usize) as u8;
        }
        Game {
            code,
            rows: Vec::new(),
            status: Status::Playing,
        }
    }

    /// Checks a full row; gives its answer pegs, or `None` when the game is over or a peg
    /// is not one of the colours
    pub fn check(&mut self, guess: Code) -> Option<(u8, u8)> {
        if self.status != Status::Playing || guess.iter().any(|&p| p >= COLOURS) {
            return None;
        }
        let answer = score(&self.code, &guess);
        self.rows.push((guess, answer));
        if answer.0 as usize == HOLES {
            self.status = Status::Won;
        } else if self.rows.len() == ROWS {
            self.status = Status::Lost;
        }
        Some(answer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const RED: u8 = 0;
    const YELLOW: u8 = 2;
    const GREEN: u8 = 3;
    const BLUE: u8 = 4;

    /// A guess that differs from `code` in every hole
    fn wrong(code: &Code) -> Code {
        code.map(|p| (p + 1) % COLOURS)
    }

    // ----- Requirement 1: the secret code -----

    #[test]
    fn requirement_1_the_same_seed_gives_the_same_code_of_4_from_6_colours() {
        assert_eq!(Game::new(42).code, Game::new(42).code);
        let mut seen = [false; COLOURS as usize];
        for seed in 0..200 {
            let game = Game::new(seed);
            assert_eq!(game.status, Status::Playing);
            for p in game.code {
                assert!(p < COLOURS);
                seen[p as usize] = true;
            }
        }
        assert!(seen.iter().all(|&s| s), "every colour is used in some code");
    }

    #[test]
    fn requirement_1_a_colour_can_be_in_the_code_more_than_once() {
        let repeats = (0..200).any(|seed| {
            let code = Game::new(seed).code;
            (0..HOLES).any(|i| code[i + 1..].contains(&code[i]))
        });
        assert!(repeats);
    }

    // ----- Requirement 3: the answer pegs -----

    #[test]
    fn requirement_3_repeated_colours() {
        let code = [RED, GREEN, BLUE, BLUE];
        assert_eq!(score(&code, &[BLUE, RED, GREEN, BLUE]), (1, 3));
    }

    #[test]
    fn requirement_3_a_peg_of_the_code_counts_only_once() {
        let code = [RED, GREEN, BLUE, YELLOW];
        assert_eq!(score(&code, &[RED, RED, RED, RED]), (1, 0));
        assert_eq!(
            score(&[RED, RED, GREEN, GREEN], &[GREEN, GREEN, RED, RED]),
            (0, 4)
        );
        assert_eq!(
            score(&[RED, RED, GREEN, GREEN], &[RED, GREEN, YELLOW, YELLOW]),
            (1, 1)
        );
    }

    #[test]
    fn requirement_3_the_code_itself_gets_4_black() {
        assert_eq!(score(&[BLUE; 4], &[BLUE; 4]), (4, 0));
        assert_eq!(score(&[RED, GREEN, BLUE, YELLOW], &[1, 5, 1, 5]), (0, 0)); // orange, purple
    }

    // ----- Requirement 4: the end -----

    #[test]
    fn requirement_4_four_black_wins_and_then_nothing_is_checked() {
        let mut game = Game::new(7);
        let code = game.code;
        assert_eq!(game.check(wrong(&code)).map(|a| a.0), Some(0));
        assert_eq!(game.check(code), Some((4, 0)));
        assert_eq!(game.status, Status::Won);
        assert_eq!(game.check(code), None);
        assert_eq!(game.rows.len(), 2);
    }

    #[test]
    fn requirement_4_ten_rows_without_the_code_lose() {
        let mut game = Game::new(3);
        let guess = wrong(&game.code);
        for _ in 0..ROWS - 1 {
            game.check(guess);
            assert_eq!(game.status, Status::Playing);
        }
        game.check(guess);
        assert_eq!(game.status, Status::Lost);
        assert_eq!(game.check(game.code), None);
    }

    #[test]
    fn requirement_4_the_code_on_the_last_row_still_wins() {
        let mut game = Game::new(3);
        for _ in 0..ROWS - 1 {
            game.check(wrong(&game.code));
        }
        game.check(game.code);
        assert_eq!(game.status, Status::Won);
    }

    #[test]
    fn a_peg_that_is_not_a_colour_is_refused() {
        let mut game = Game::new(1);
        assert_eq!(game.check([0, 1, COLOURS, 2]), None);
        assert!(game.rows.is_empty());
    }
}
