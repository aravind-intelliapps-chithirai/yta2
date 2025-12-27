// Optimized Series Expansion (First 5 terms)
// x must be reduced to range [-PI, PI] for accuracy
const PI = 3.141592653589793;
const TWO_PI = 6.283185307179586;
const C3 = 1 / 6;
const C5 = 1 / 120;
const C7 = 1 / 5040;
const C9 = 1 / 362880;

export function fastSin(input: number): number {
    // 1. Modulo Reduction (Cheap Division) to keep input small
    let x = input % TWO_PI;
    if (x > PI) x -= TWO_PI;
    if (x < -PI) x += TWO_PI;

    // 2. Taylor Series (x - x^3/3! + x^5/5! - x^7/7! + x^9/9!)
    const x2 = x * x;
    const x3 = x2 * x;
    const x5 = x3 * x2;
    const x7 = x5 * x2;
    const x9 = x7 * x2;

    return x - (x3 * C3) + (x5 * C5) - (x7 * C7) + (x9 * C9);
}

// Cosine can be derived: cos(x) = sin(x + PI/2)
export function fastCos(input: number): number {
    return fastSin(input + 1.5707963268);
}