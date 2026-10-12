//! A small seeded random generator (mulberry32), so games and tests can repeat a result
//! exactly. JavaScript passes the seed; see ADR-0006.

pub struct Rng(u32);

impl Rng {
    pub fn new(seed: u32) -> Self {
        Rng(seed)
    }

    /// A number from 0 (inclusive) to 1 (exclusive)
    pub fn next_f64(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6d2b_79f5);
        let mut t = (self.0 ^ (self.0 >> 15)).wrapping_mul(1 | self.0);
        t = (t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t))) ^ t;
        f64::from(t ^ (t >> 14)) / 4_294_967_296.0
    }

    /// A whole number from 0 to `n - 1`
    pub fn below(&mut self, n: usize) -> usize {
        (self.next_f64() * n as f64) as usize
    }

    /// Fisher-Yates shuffle
    pub fn shuffle<T>(&mut self, items: &mut [T]) {
        for i in (1..items.len()).rev() {
            let j = self.below(i + 1);
            items.swap(i, j);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_same_seed_gives_the_same_numbers() {
        let (mut a, mut b) = (Rng::new(7), Rng::new(7));
        for _ in 0..100 {
            assert_eq!(a.next_f64(), b.next_f64());
        }
    }

    #[test]
    fn gives_the_same_numbers_as_mulberry32_in_javascript() {
        let mut rng = Rng::new(1);
        let first = [rng.next_f64(), rng.next_f64(), rng.next_f64()];
        assert_eq!(
            first,
            [0.6270739405881613, 0.002735721180215478, 0.5274470399599522]
        );
    }

    #[test]
    fn numbers_stay_between_0_and_1() {
        let mut rng = Rng::new(1);
        for _ in 0..10_000 {
            let x = rng.next_f64();
            assert!((0.0..1.0).contains(&x));
        }
    }

    #[test]
    fn below_covers_the_whole_range() {
        let mut rng = Rng::new(3);
        let mut seen = [false; 6];
        for _ in 0..1000 {
            seen[rng.below(6)] = true;
        }
        assert!(seen.iter().all(|&s| s));
    }

    #[test]
    fn shuffle_keeps_every_item() {
        let mut rng = Rng::new(5);
        let mut items: Vec<u32> = (0..20).collect();
        rng.shuffle(&mut items);
        assert_ne!(items, (0..20).collect::<Vec<_>>());
        items.sort();
        assert_eq!(items, (0..20).collect::<Vec<_>>());
    }

    #[test]
    fn shuffle_gives_the_same_order_as_fisher_yates_in_javascript() {
        let mut items: Vec<u32> = (0..10).collect();
        Rng::new(5).shuffle(&mut items);
        assert_eq!(items, [5, 3, 7, 8, 2, 0, 4, 1, 9, 6]);
    }
}
