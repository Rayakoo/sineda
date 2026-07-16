const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function randomLetter(row: number, col: number, gridWidth: number): string {
  const seed = row * gridWidth + col;
  const idx = Math.floor(seededRandom(seed) * LETTERS.length);
  return LETTERS[idx];
}

export type FillLetter = { char: string; isAnswer: boolean };

export function buildRandomFillGrid(
  gridWidth: number,
  gridHeight: number,
  placedWords: { answer: string; row: number; col: number; direction: "across" | "down" }[]
): FillLetter[][] {
  const grid: FillLetter[][] = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => ({ char: "", isAnswer: false }))
  );

  for (const w of placedWords) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === "across" ? w.row : w.row + i;
      const c = w.direction === "across" ? w.col + i : w.col;
      if (r < 0 || r >= gridHeight || c < 0 || c >= gridWidth) continue;
      grid[r][c] = { char: w.answer[i].toUpperCase(), isAnswer: true };
    }
  }

  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      if (!grid[r][c].char) {
        grid[r][c] = { char: randomLetter(r, c, gridWidth), isAnswer: false };
      }
    }
  }

  return grid;
}
