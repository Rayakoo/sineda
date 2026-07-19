"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";

export type FindWordItem = {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  row: number;
  col: number;
  direction: "across" | "down";
};

type Props = {
  gridWidth: number;
  gridHeight: number;
  initialWords?: FindWordItem[];
  onChange: (words: FindWordItem[]) => void;
};

let nextId = 1;
function genId() { return `fw_${nextId++}`; }

export default function FindWordGridEditor({ gridWidth, gridHeight, initialWords, onChange }: Props) {
  const [words, setWords] = useState<FindWordItem[]>(initialWords || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(words);
  }, [words]);

  const wordMap = useMemo(() => {
    const m = new Map<string, FindWordItem>();
    for (const w of words) m.set(w.id, w);
    return m;
  }, [words]);

  const cellContents = useMemo(() => {
    const cells = new Map<string, { letter: string; wordIds: string[] }>();
    for (const w of words) {
      for (let i = 0; i < w.answer.length; i++) {
        const r = w.direction === "across" ? w.row : w.row + i;
        const c = w.direction === "across" ? w.col + i : w.col;
        if (r < 0 || r >= gridHeight || c < 0 || c >= gridWidth) continue;
        const key = `${r}_${c}`;
        if (!cells.has(key)) cells.set(key, { letter: w.answer[i], wordIds: [w.id] });
        else {
          const existing = cells.get(key)!;
          existing.wordIds.push(w.id);
          if (!existing.letter) existing.letter = w.answer[i];
        }
      }
    }
    return cells;
  }, [words, gridWidth, gridHeight]);

  const canPlace = useCallback((row: number, col: number, dir: "across" | "down", answer: string, excludeId?: string): boolean => {
    for (let i = 0; i < answer.length; i++) {
      const r = dir === "across" ? row : row + i;
      const c = dir === "across" ? col + i : col;
      if (r < 0 || r >= gridHeight || c < 0 || c >= gridWidth) return false;
      const key = `${r}_${c}`;
      const existing = cellContents.get(key);
      if (existing && existing.wordIds.some(wid => wid !== excludeId)) return false;
    }
    return true;
  }, [cellContents, gridWidth, gridHeight]);

  const findBestPosition = useCallback((dir: "across" | "down", answer: string, excludeId?: string): { row: number; col: number } | null => {
    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        if (canPlace(r, c, dir, answer, excludeId)) return { row: r, col: c };
      }
    }
    return null;
  }, [canPlace, gridWidth, gridHeight]);

  const selectedWord = selectedId ? wordMap.get(selectedId) : null;

  const addWord = useCallback(() => {
    let row = 0, col = 0;
    let found = false;
    for (let r = 0; r < gridHeight && !found; r++) {
      for (let c = 0; c < gridWidth && !found; c++) {
        if (!cellContents.has(`${r}_${c}`)) { row = r; col = c; found = true; }
      }
    }
    const id = genId();
    setWords(prev => [...prev, { id, question: "", answer: "", explanation: "", row, col, direction: "across" as const }]);
    setSelectedId(id);
  }, [cellContents, gridWidth, gridHeight]);

  const updateWord = useCallback((id: string, updates: Partial<FindWordItem>) => {
    setWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const removeWord = useCallback((id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const moveWord = useCallback((id: string, dr: number, dc: number) => {
    const w = words.find(x => x.id === id);
    if (!w) return;
    const newRow = w.row + dr;
    const newCol = w.col + dc;
    if (!canPlace(newRow, newCol, w.direction, w.answer, id)) return;
    updateWord(id, { row: newRow, col: newCol });
  }, [words, canPlace, updateWord]);

  const toggleDirection = useCallback((id: string) => {
    const w = words.find(x => x.id === id);
    if (!w) return;
    const newDir = w.direction === "across" ? "down" : "across";
    if (canPlace(w.row, w.col, newDir, w.answer, id)) {
      updateWord(id, { direction: newDir });
    } else {
      const pos = findBestPosition(newDir, w.answer, id);
      if (pos) {
        updateWord(id, { direction: newDir, row: pos.row, col: pos.col });
      } else {
        alert(`Tidak ada tempat untuk "${w.answer}" dengan arah ${newDir === "across" ? "mendatar" : "menurun"}. Perbesar grid atau hapus kata lain.`);
      }
    }
  }, [words, canPlace, findBestPosition, updateWord]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedWord) return;
    if (!canPlace(row, col, selectedWord.direction, selectedWord.answer, selectedWord.id)) return;
    updateWord(selectedWord.id, { row, col });
  }, [selectedWord, canPlace, updateWord]);

  return (
    <div className="space-y-6">
      <div className="w-full max-w-full overflow-x-auto">
        <div
          className="inline-grid gap-[2px] bg-slate-900 rounded-md p-[2px] shadow-lg"
          style={{ gridTemplateColumns: `repeat(${gridWidth}, 32px)` }}
        >
          {Array.from({ length: gridHeight }, (_, ri) =>
            Array.from({ length: gridWidth }, (_, ci) => {
              const key = `${ri}_${ci}`;
              const cell = cellContents.get(key);
              const isSelected = cell?.wordIds.includes(selectedId || "");
              const isStart = cell && words.some(w => cell.wordIds.includes(w.id) && w.row === ri && w.col === ci);
              const isConflict = cell && cell.wordIds.length > 1;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCellClick(ri, ci)}
                  className={`relative w-8 h-8 rounded-sm border flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected
                      ? "border-amber-500 bg-[#F7941E] text-white shadow-md scale-110 z-10"
                      : cell
                        ? "border-[#005696] bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-gray-50 hover:border-gray-400 cursor-pointer"
                  } ${isConflict ? "ring-2 ring-amber-400" : ""}`}
                >
                  <span className={`uppercase ${
                    isSelected ? "text-white" : cell ? "text-gray-800 font-extrabold" : "text-gray-300"
                  }`}>
                    {cell?.letter || "."}
                  </span>
                  {isStart && cell && cell.wordIds.length <= 1 && (
                    <span className="absolute -top-2 -right-2 text-[10px] font-black">
                      {words.find(w => cell.wordIds.includes(w.id) && w.row === ri && w.col === ci)?.direction === "across"
                        ? <span className="text-white bg-blue-600 rounded-full w-3.5 h-3.5 flex items-center justify-center"><i className="fas fa-arrow-right text-[8px]"></i></span>
                        : <span className="text-white bg-emerald-600 rounded-full w-3.5 h-3.5 flex items-center justify-center"><i className="fas fa-arrow-down text-[8px]"></i></span>
                      }
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-gray-700">Kata dalam Grid</h4>
        <button
          type="button"
          onClick={addWord}
          className="inline-flex items-center gap-1 bg-[#005696] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#003d6e]"
        >
          <i className="fas fa-plus text-xs"></i> Tambah Kata
        </button>
      </div>

      {words.length === 0 && (
        <p className="text-xs text-gray-400 italic">Klik &quot;Tambah Kata&quot; untuk menambah kata ke grid.</p>
      )}

      {words.map((w) => (
        <div
          key={w.id}
          onClick={() => setSelectedId(w.id)}
          className={`bg-white border-2 rounded-xl p-4 space-y-3 cursor-pointer transition-all ${
            selectedId === w.id
              ? "border-[#F7941E] shadow-md"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 px-2 py-0.5 rounded bg-gray-100">
              {w.answer || "(belum diisi)"}
            </span>
            <button type="button" onClick={(e) => { e.stopPropagation(); removeWord(w.id); }} className="text-red-400 hover:text-red-600">
              <i className="fas fa-trash"></i>
            </button>
          </div>

          {selectedId === w.id ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Pertanyaan</label>
                <input
                  type="text"
                  value={w.question}
                  onChange={(e) => updateWord(w.id, { question: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Jawaban</label>
                  <input
                    type="text"
                    value={w.answer}
                    onChange={(e) => updateWord(w.id, { answer: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Penjelasan (opsional)</label>
                  <input
                    type="text"
                    value={w.explanation}
                    onChange={(e) => updateWord(w.id, { explanation: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-gray-500">Posisi: ({w.row}, {w.col})</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveWord(w.id, -1, 0)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><i className="fas fa-arrow-up text-xs"></i></button>
                  <button type="button" onClick={() => moveWord(w.id, 1, 0)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><i className="fas fa-arrow-down text-xs"></i></button>
                  <button type="button" onClick={() => moveWord(w.id, 0, -1)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><i className="fas fa-arrow-left text-xs"></i></button>
                  <button type="button" onClick={() => moveWord(w.id, 0, 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><i className="fas fa-arrow-right text-xs"></i></button>
                </div>
                <div className="ml-auto">
                  <span className="text-xs text-gray-500 mr-2">Arah:</span>
                  <button
                    type="button"
                    onClick={() => toggleDirection(w.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      w.direction === "across"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <i className={`fas ${w.direction === "across" ? "fa-arrow-right" : "fa-arrow-down"} text-xs`}></i>
                    {w.direction === "across" ? "Mendatar" : "Menurun"}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Klik cell di grid untuk menempatkan kata, atau gunakan tombol panah untuk geser.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">{w.question || <span className="text-gray-300 italic">Belum ada pertanyaan</span>}</p>
              <p className="text-xs text-gray-400 mt-1">
                {w.direction === "across" ? "Mendatar" : "Menurun"} · posisi ({w.row}, {w.col})
              </p>
              {w.explanation && <p className="text-xs text-gray-400 mt-0.5">{w.explanation}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
