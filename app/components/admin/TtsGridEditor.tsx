"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";

export type CellClue = {
  number: number;
  direction: "across" | "down";
  question: string;
  answer: string;
  explanation: string;
};

export type TtsCellData = {
  id: string;
  row: number;
  col: number;
  letter: string;
  clues: CellClue[];
};

type Props = {
  initialCells?: TtsCellData[];
  onChange: (clues: { number: number; question: string; answer: string; explanation: string; row: number; col: number; direction: "across" | "down" }[]) => void;
};

function cellId(row: number, col: number) { return `r${row}c${col}`; }

function getAnswerFromCellMap(cellMap: Map<string, TtsCellData>, startRow: number, startCol: number, dir: "across" | "down"): string {
  let ans = "";
  if (dir === "across") {
    for (let c = startCol; ; c++) {
      const cell = cellMap.get(cellId(startRow, c));
      if (!cell || !cell.letter) break;
      ans += cell.letter;
    }
  } else {
    for (let r = startRow; ; r++) {
      const cell = cellMap.get(cellId(r, startCol));
      if (!cell || !cell.letter) break;
      ans += cell.letter;
    }
  }
  return ans;
}

export default function TtsGridEditor({ initialCells, onChange }: Props) {
  const [cells, setCells] = useState<TtsCellData[]>(initialCells || []);
  const initialLoaded = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (initialCells && initialCells.length > 0) {
      setCells(initialCells);
    }
  }, [initialCells]);

  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      return;
    }
    const tempMap = new Map(cells.map(c => [c.id, c]));
    const clues: { number: number; question: string; answer: string; explanation: string; row: number; col: number; direction: "across" | "down" }[] = [];
    for (const c of cells) {
      for (const clue of c.clues) {
        let answer = clue.answer;
        if (!answer) {
          answer = getAnswerFromCellMap(tempMap, c.row, c.col, clue.direction);
        }
        clues.push({
          number: clue.number,
          question: clue.question,
          answer,
          explanation: clue.explanation,
          row: c.row,
          col: c.col,
          direction: clue.direction,
        });
      }
    }
    onChangeRef.current(clues);
  }, [cells]);

  const cellMap = useMemo(() => {
    const m = new Map<string, TtsCellData>();
    for (const c of cells) m.set(c.id, c);
    return m;
  }, [cells]);

  const bounds = useMemo(() => {
    if (cells.length === 0) return { minR: 0, maxR: 0, minC: 0, maxC: 0 };
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const c of cells) {
      if (c.row < minR) minR = c.row;
      if (c.row > maxR) maxR = c.row;
      if (c.col < minC) minC = c.col;
      if (c.col > maxC) maxC = c.col;
    }
    return { minR, maxR, minC, maxC };
  }, [cells]);

  const addCell = useCallback((row: number, col: number) => {
    const id = cellId(row, col);
    if (cellMap.has(id)) return;
    setCells(prev => [...prev, { id, row, col, letter: "", clues: [] }]);
  }, [cellMap]);

  const updateCell = useCallback((id: string, letter?: string, clueIndex?: number, clueUpdate?: Partial<CellClue>) => {
    setCells(prev => {
      let updatedCells = prev.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c };
        if (letter !== undefined) updated.letter = letter;
        if (clueIndex !== undefined && clueUpdate) {
          const clues = [...c.clues];
          clues[clueIndex] = { ...clues[clueIndex], ...clueUpdate };
          updated.clues = clues;
        }
        return updated;
      });
      if (clueUpdate && "answer" in clueUpdate && clueUpdate.answer !== undefined) {
        const cell = updatedCells.find(c => c.id === id);
        if (cell && clueIndex !== undefined) {
          const clue = cell.clues[clueIndex];
          if (clue) {
            const oldAns = (prev.find(c => c.id === id)?.clues[clueIndex]?.answer) || "";
            const newAns = clueUpdate.answer;
            const maxLen = Math.max(oldAns.length, newAns.length);
            for (let i = 0; i < maxLen; i++) {
              const r = clue.direction === "across" ? cell.row : cell.row + i;
              const c = clue.direction === "across" ? cell.col + i : cell.col;
              const cid = cellId(r, c);
              if (i < newAns.length) {
                const existing = updatedCells.find(x => x.id === cid);
                if (existing) {
                  updatedCells = updatedCells.map(x => x.id === cid ? { ...x, letter: newAns[i] } : x);
                } else {
                  updatedCells.push({ id: cid, row: r, col: c, letter: newAns[i], clues: [] });
                }
              } else {
                updatedCells = updatedCells.map(x => x.id === cid ? { ...x, letter: "" } : x);
              }
            }
          }
        }
      }
      return updatedCells;
    });
  }, []);

  const addClueToCell = useCallback((id: string, direction: "across" | "down") => {
    setCells(prev => {
      const cell = prev.find(c => c.id === id);
      if (!cell || cell.clues.some(c => c.direction === direction)) return prev;
      const existingNums = new Set(prev.flatMap(x => x.clues.map(cl => cl.number)));
      let num = 1;
      while (existingNums.has(num)) num++;
      return prev.map(c => c.id === id ? { ...c, clues: [...c.clues, { number: num, direction, question: "", answer: "", explanation: "" }] } : c);
    });
  }, []);

  const removeClue = useCallback((id: string, index: number) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, clues: c.clues.filter((_, i) => i !== index) } : c));
  }, []);

  const removeCell = useCallback((id: string) => {
    setCells(prev => prev.filter(c => c.id !== id));
  }, []);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedCell = selected ? cellMap.get(selected) : null;

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const { minR, maxR, minC, maxC } = bounds;
  const gridCols = maxC - minC + 1;

  if (cells.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-400">Klik tombol di bawah untuk membuat cell pertama:</p>
        <div className="flex justify-center">
          <div className="relative inline-flex p-8 border-2 border-dashed border-gray-300 rounded-2xl">
            <button type="button" onClick={() => addCell(0, 0)} className="w-12 h-12 bg-[#005696] text-white rounded-xl hover:bg-[#003d6e] flex items-center justify-center shadow-md transition-all">
              <i className="fas fa-plus text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full max-w-full overflow-x-auto pb-2">
        <div
          className="inline-grid gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${gridCols + 2}, 40px)` }}
        >
          {Array.from({ length: maxR - minR + 3 }, (_, ri) => {
            const r = minR - 1 + ri;
            return Array.from({ length: gridCols + 2 }, (_, ci) => {
              const c = minC - 1 + ci;
              const id = cellId(r, c);
              const cell = cellMap.get(id);
              const hasNeighbor = dirs.some(([dr, dc]) => cellMap.has(cellId(r + dr, c + dc)));

              if (!cell && hasNeighbor) {
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => addCell(r, c)}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-blue-300/40 flex items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-all group"
                    title="Tambah cell"
                  >
                    <i className="fas fa-plus text-blue-300/50 group-hover:text-blue-400 text-sm"></i>
                  </button>
                );
              }

              if (cell) {
                const nums = [...new Set(cell.clues.map(cl => cl.number))].sort((a, b) => a - b);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelected(id)}
                    className={`relative w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-base transition-all ${
                      selected === id
                        ? "border-[#F7941E] ring-2 ring-[#F7941E]/40 bg-amber-50 shadow-md scale-105"
                        : cell.clues.length > 0
                          ? "border-[#005696] bg-blue-50 shadow-md"
                          : cell.letter
                            ? "border-gray-300 bg-gray-100 shadow-sm"
                            : "border-gray-200 bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    <span className={`uppercase ${cell.letter ? "text-gray-800 font-extrabold" : "text-gray-300"}`}>
                      {cell.letter || "."}
                    </span>
                    {nums.length === 1 && (
                      <span className="absolute -top-[2px] -left-[1px] text-[10px] font-extrabold text-[#005696] pointer-events-none select-none leading-none bg-white/80 px-[2px] rounded-sm">
                        {nums[0]}
                      </span>
                    )}
                    {nums.length >= 2 && (
                      <span className="absolute -top-[2px] -left-[1px] text-[9px] font-extrabold text-[#005696] pointer-events-none select-none leading-tight text-left bg-white/80 px-[2px] rounded-sm">
                        {nums.slice(0, 2).join("/")}
                      </span>
                    )}
                  </button>
                );
              }

              if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
                return <div key={id} className="w-10 h-10" />;
              }

              return <div key={id} className="w-10 h-10" />;
            });
          })}
        </div>
      </div>

      {selectedCell && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">
              Cell ({selectedCell.row + 1}, {selectedCell.col + 1})
            </h4>
            <button type="button" onClick={() => { removeCell(selectedCell.id); setSelected(null); }} className="text-red-400 hover:text-red-600">
              <i className="fas fa-trash"></i>
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500">Huruf</label>
            <input
              type="text"
              value={selectedCell.letter}
              onChange={(e) => {
                const ch = e.target.value.slice(-1).toUpperCase().replace(/[^A-Z]/g, "");
                updateCell(selectedCell.id, ch);
              }}
              maxLength={1}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center uppercase max-w-[60px]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500">Clue</h5>
              <div className="flex gap-1">
                {(() => {
                  const hasRight = cellMap.has(cellId(selectedCell.row, selectedCell.col + 1));
                  const hasBelow = cellMap.has(cellId(selectedCell.row + 1, selectedCell.col));
                  const hasAcross = selectedCell.clues.some(c => c.direction === "across");
                  const hasDown = selectedCell.clues.some(c => c.direction === "down");
                  return (
                    <>
                      {hasRight && !hasAcross && (
                        <button type="button" onClick={() => addClueToCell(selectedCell.id, "across")} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md hover:bg-blue-100 font-semibold">
                          + Mendatar
                        </button>
                      )}
                      {hasBelow && !hasDown && (
                        <button type="button" onClick={() => addClueToCell(selectedCell.id, "down")} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md hover:bg-emerald-100 font-semibold">
                          + Menurun
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {selectedCell.clues.length === 0 && (
              <p className="text-xs text-gray-400 italic">Tambah clue dengan tombol di atas (jika ada cell di sebelah kanan/bawah).</p>
            )}

            {selectedCell.clues.map((clue, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${clue.direction === "across" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {clue.direction === "across" ? "Mendatar" : "Menurun"}
                  </span>
                  <button type="button" onClick={() => removeClue(selectedCell.id, idx)} className="text-red-400 hover:text-red-600">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Nomor</label>
                    <input
                      type="number"
                      value={clue.number}
                      onChange={(e) => updateCell(selectedCell.id, undefined, idx, { number: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Pertanyaan</label>
                    <input
                      type="text"
                      value={clue.question}
                      onChange={(e) => updateCell(selectedCell.id, undefined, idx, { question: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jawaban</label>
                    <input
                      type="text"
                      value={clue.answer || getAnswerFromCellMap(cellMap, selectedCell.row, selectedCell.col, clue.direction)}
                      onChange={(e) => updateCell(selectedCell.id, undefined, idx, { answer: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
                      placeholder="Ketik jawaban di sini, cell akan terisi otomatis"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Tulis jawaban utuh (misal: BISA), grid akan terisi otomatis tanpa perlu klik cell satu-satu.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Penjelasan (opsional)</label>
                    <input
                      type="text"
                      value={clue.explanation}
                      onChange={(e) => updateCell(selectedCell.id, undefined, idx, { explanation: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
