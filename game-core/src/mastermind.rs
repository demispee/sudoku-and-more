//! Mastermind: break a secret code of coloured pegs.
//! See `.openspec/specs/007-mastermind/spec.md`.

use crate::random::Rng;

pub const ROWS: usize = 10;

/// The levels: holes per row and colours. Classic first, then hard.
pub const LEVELS: [(usize, u8); 2] = [(4, 6), (5, 8)];

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Status {
    Playing,
    Won,
    Lost,
}

/// The answer pegs for a guess: (black, white)
pub fn score(code: &[u8], guess: &[u8]) -> (u8, u8) {
    let black = code.iter().zip(guess).filter(|(c, g)| c == g).count();
    // Every colour counts as often as it is in both, at most once per peg of the code
    let colours = code.iter().chain(guess).max().map_or(0, |&c| c + 1);
    let same: usize = (0..colours)
        .map(|c| {
            let in_code = code.iter().filter(|&&p| p == c).count();
            let in_guess = guess.iter().filter(|&&p| p == c).count();
            in_code.min(in_guess)
        })
        .sum();
    (black as u8, (same - black) as u8)
}

pub struct Game {
    pub code: Vec<u8>,
    pub colours: u8,
    /// Every checked row with its answer pegs
    pub rows: Vec<(Vec<u8>, (u8, u8))>,
    pub status: Status,
}

impl Game {
    /// A new game of `LEVELS[level]`; an unknown level is classic
    pub fn new(seed: u32, level: usize) -> Game {
        let (holes, colours) = LEVELS.get(level).copied().unwrap_or(LEVELS[0]);
        let mut rng = Rng::new(seed);
        let code = (0..holes)
            .map(|_| rng.below(colours as usize) as u8)
            .collect();
        Game {
            code,
            colours,
            rows: Vec::new(),
            status: Status::Playing,
        }
    }

    /// Checks a full row; gives its answer pegs, or `None` when the game is over, the row
    /// has the wrong length or a peg is not one of the colours
    pub fn check(&mut self, guess: &[u8]) -> Option<(u8, u8)> {
        if self.status != Status::Playing
            || guess.len() != self.code.len()
            || guess.iter().any(|&p| p >= self.colours)
        {
            return None;
        }
        let answer = score(&self.code, guess);
        self.rows.push((guess.to_vec(), answer));
        if answer.0 as usize == self.code.len() {
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

    /// A guess that differs from the code in every hole
    fn wrong(game: &Game) -> Vec<u8> {
        game.code.iter().map(|p| (p + 1) % game.colours).collect()
    }

    // ----- Requirement 1: the secret code -----

    #[test]
    fn requirement_1_the_same_seed_gives_the_same_code_of_4_from_6_colours() {
        assert_eq!(Game::new(42, 0).code, Game::new(42, 0).code);
        let mut seen = [false; 6];
        for seed in 0..200 {
            let game = Game::new(seed, 0);
            assert_eq!((game.status, game.code.len()), (Status::Playing, 4));
            for p in game.code {
                seen[p as usize] = true;
            }
        }
        assert!(seen.iter().all(|&s| s), "every colour is used in some code");
    }

    #[test]
    fn requirement_1_a_colour_can_be_in_the_code_more_than_once() {
        let repeats = (0..200).any(|seed| {
            let code = Game::new(seed, 0).code;
            (0..code.len()).any(|i| code[i + 1..].contains(&code[i]))
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
    fn requirement_3_the_code_itself_gets_all_black() {
        assert_eq!(score(&[BLUE; 4], &[BLUE; 4]), (4, 0));
        assert_eq!(score(&[RED, GREEN, BLUE, YELLOW], &[1, 5, 1, 5]), (0, 0)); // orange, purple
        assert_eq!(score(&[7, 6, 0, 1, 2], &[6, 7, 0, 1, 3]), (2, 2));
    }

    // ----- Requirement 4: the end -----

    #[test]
    fn requirement_4_all_black_wins_and_then_nothing_is_checked() {
        let mut game = Game::new(7, 0);
        let code = game.code.clone();
        assert_eq!(game.check(&wrong(&game)).map(|a| a.0), Some(0));
        assert_eq!(game.check(&code), Some((4, 0)));
        assert_eq!(game.status, Status::Won);
        assert_eq!(game.check(&code), None);
        assert_eq!(game.rows.len(), 2);
    }

    #[test]
    fn requirement_4_ten_rows_without_the_code_lose() {
        let mut game = Game::new(3, 0);
        let guess = wrong(&game);
        for _ in 0..ROWS - 1 {
            game.check(&guess);
            assert_eq!(game.status, Status::Playing);
        }
        game.check(&guess);
        assert_eq!(game.status, Status::Lost);
        assert_eq!(game.check(&game.code.clone()), None);
    }

    #[test]
    fn requirement_4_the_code_on_the_last_row_still_wins() {
        let mut game = Game::new(3, 0);
        for _ in 0..ROWS - 1 {
            game.check(&wrong(&game));
        }
        game.check(&game.code.clone());
        assert_eq!(game.status, Status::Won);
    }

    #[test]
    fn a_row_of_the_wrong_length_or_colour_is_refused() {
        let mut game = Game::new(1, 0);
        assert_eq!(game.check(&[0, 1, 6, 2]), None);
        assert_eq!(game.check(&[0, 1, 2]), None);
        assert_eq!(game.check(&[0, 1, 2, 3, 4]), None);
        assert!(game.rows.is_empty());
    }

    // ----- Requirement 8: levels -----

    #[test]
    fn requirement_8_hard_has_5_holes_and_8_colours() {
        assert_eq!(LEVELS, [(4, 6), (5, 8)]);
        let mut seen = [false; 8];
        for seed in 0..200 {
            let game = Game::new(seed, 1);
            assert_eq!((game.code.len(), game.colours), (5, 8));
            for &p in &game.code {
                seen[p as usize] = true;
            }
        }
        assert!(seen.iter().all(|&s| s));
        let mut game = Game::new(9, 1);
        assert_eq!(game.check(&[7, 7, 7, 7]), None);
        let code = game.code.clone();
        assert_eq!(game.check(&code), Some((5, 0)));
        assert_eq!(game.status, Status::Won);
    }

    #[test]
    fn an_unknown_level_is_classic() {
        let game = Game::new(4, 9);
        assert_eq!((game.code.len(), game.colours), (4, 6));
    }
}
