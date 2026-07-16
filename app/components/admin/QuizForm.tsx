"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  getCourseSections,
} from "@/services/courses";
import type { Quiz, QuizQuestion } from "@/types/course";

interface QuestionState {
  id: number;
  tempId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  imageUrl: string;
}

interface QuizFormProps {
  courseId: string;
  quizData?: Quiz | null;
  existingQuestions?: QuizQuestion[];
  onSuccess?: () => void;
}

let tempIdCounter = 0;
const genTempId = () => `new_${++tempIdCounter}`;

export default function QuizForm({ courseId, quizData, existingQuestions, onSuccess }: QuizFormProps) {
  const router = useRouter();
  const isNew = !quizData;
  const [title, setTitle] = useState(quizData?.title ?? "");
  const [description, setDescription] = useState(quizData?.description ?? "");
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingQuestions && existingQuestions.length > 0) {
      setQuestions(
        existingQuestions.map((q, i) => ({
          id: i + 1,
          tempId: q.id,
          text: q.question_text,
          options: q.options.length >= 2 ? q.options : ["", ""],
          correctAnswer: q.correct_answer,
          imageUrl: q.image_url || "",
        }))
      );
    } else {
      setQuestions([{ id: 1, tempId: genTempId(), text: "", options: ["", ""], correctAnswer: "", imageUrl: "" }]);
    }
  }, [existingQuestions]);

  const handleAddQuestion = () => {
    const newId = questions.length + 1;
    setQuestions([...questions, { id: newId, tempId: genTempId(), text: "", options: ["", ""], correctAnswer: "", imageUrl: "" }]);
  };

  const handleRemoveQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionText = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const handleOptionText = (qId: number, optIdx: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        const oldOpt = q.options[optIdx];
        const newOptions = q.options.map((o, i) => (i === optIdx ? text : o));
        const correctAnswer = q.correctAnswer === oldOpt ? text : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer };
      })
    );
  };

  const handleSelectAnswer = (qId: number, optionText: string) => {
    setQuestions(questions.map((q) =>
      q.id === qId
        ? { ...q, correctAnswer: q.correctAnswer === optionText ? "" : optionText }
        : q
    ));
  };

  const handleAddOption = (qId: number) => {
    setQuestions(questions.map((q) =>
      q.id === qId ? { ...q, options: [...q.options, ""] } : q
    ));
  };

  const handleRemoveOption = (qId: number, optIdx: number) => {
    setQuestions(questions.map((q) => {
      if (q.id !== qId) return q;
      if (q.options.length <= 2) return q;
      const removed = q.options[optIdx];
      const newOptions = q.options.filter((_, i) => i !== optIdx);
      const correctAnswer = q.correctAnswer === removed ? "" : q.correctAnswer;
      return { ...q, options: newOptions, correctAnswer };
    }));
  };

  const handleImageUrl = (qId: number, url: string) => {
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, imageUrl: url } : q)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title) { alert("Judul quiz wajib diisi."); return; }

    const invalidQuestion = questions.find((q) => {
      if (!q.text || q.options.length < 2 || q.options.some((o) => !o)) return true;
      return false;
    });
    if (invalidQuestion) { alert("Setiap soal minimal 2 pilihan jawaban dan semua harus diisi."); return; }
    const noCorrectAnswer = questions.find((q) => !q.correctAnswer);
    if (noCorrectAnswer) { alert("Pilih jawaban benar untuk setiap soal."); return; }

    setSaving(true);
    try {
      let quizId = quizData?.id;

      if (isNew) {
        const sections = await getCourseSections(courseId);
        const urutan = sections.length > 0 ? Math.max(...sections.map((s) => s.urutan)) + 1 : 1;
        const created = await createQuiz({ course_id: courseId, title, description: description || undefined, urutan });
        quizId = created.id;
      } else {
        await updateQuiz(quizData.id, { title, description: description || undefined });
      }

      const existingIds = new Set((existingQuestions ?? []).map((q) => q.id));
      const submittedIds = new Set<string>();

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const isTempId = q.tempId.startsWith("new_");

        if (isTempId) {
          await createQuizQuestion({
            quiz_id: quizId!,
            question_text: q.text,
            options: q.options,
            correct_answer: q.correctAnswer,
            urutan: i,
            image_url: q.imageUrl || undefined,
          });
        } else {
          submittedIds.add(q.tempId);
          await updateQuizQuestion(q.tempId, {
            question_text: q.text,
            options: q.options,
            correct_answer: q.correctAnswer,
            urutan: i,
            image_url: q.imageUrl || undefined,
          });
        }
      }

      for (const existingId of existingIds) {
        if (!submittedIds.has(existingId)) {
          await deleteQuizQuestion(existingId);
        }
      }

      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quizData) { router.push(`/admin/course/${courseId}`); return; }
    if (!window.confirm("Yakin ingin menghapus quiz ini?")) return;
    setSaving(true);
    try {
      await deleteQuiz(quizData.id);
      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        <i className="fas fa-question-circle text-[#005696] mr-3"></i>
        {isNew ? "Tambah Quiz Baru" : "Edit Quiz"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Quiz</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: Evaluasi Pemahaman"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Petunjuk atau informasi tambahan"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700">
              <i className="fas fa-list mr-2"></i>
              Daftar Soal ({questions.length})
            </h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-sm text-[#005696] font-semibold hover:underline flex items-center gap-1"
            >
              <i className="fas fa-plus"></i> Tambah Soal
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="p-5 border rounded-xl bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#005696] text-xs font-bold text-white flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-400">Jawaban Benar</span>
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Hapus soal"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => handleQuestionText(q.id, e.target.value)}
                  placeholder={`Soal nomor ${index + 1}`}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
                />

                <div>
                  <input
                    type="text"
                    value={q.imageUrl}
                    onChange={(e) => handleImageUrl(q.id, e.target.value)}
                    placeholder="URL gambar (opsional, untuk ditampilkan di soal)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
                  />
                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Preview"
                      className="mt-2 max-h-32 rounded-lg object-contain border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctAnswer === opt;
                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={isCorrect}
                          onChange={() => opt && handleSelectAnswer(q.id, opt)}
                          className="w-4 h-4 text-[#005696]"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionText(q.id, optIdx, e.target.value)}
                          placeholder={`Pilihan jawaban ${String.fromCharCode(65 + optIdx)}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(q.id, optIdx)}
                            className="text-red-400 hover:text-red-600 text-xs"
                            title="Hapus pilihan"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      className="text-xs text-gray-500 hover:text-[#005696] font-medium"
                    >
                      <i className="fas fa-plus mr-1"></i> Tambah opsi
                    </button>
                  )}
                </div>

                {!q.correctAnswer && (
                  <p className="text-xs text-orange-500">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    Pilih jawaban benar dengan radio button
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#005696] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#003d6e] transition disabled:opacity-50 flex items-center gap-2"
          >
            <i className="fas fa-save"></i>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
          >
            <i className={`fas ${quizData ? "fa-trash" : "fa-times"}`}></i>
            {quizData ? "Hapus" : "Batal"}
          </button>
        </div>
      </form>
    </div>
  );
}
