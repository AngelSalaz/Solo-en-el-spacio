/** Comprueba un código de cerradura de símbolos (función pura, probada con Vitest). */
export function checkCode(code: number[], input: number[]): boolean {
  return code.length === input.length && code.every((d, i) => d === input[i]);
}

export function wrapDigit(d: number, delta: number): number {
  return (((d + delta) % 10) + 10) % 10;
}
