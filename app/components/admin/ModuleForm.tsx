"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseMaterial, updateCourseMaterial, deleteCourseMaterial, getCourseSections } from "@/services/courses";
import type { CourseMaterial } from "@/types/course";

interface ModuleFormProps {
  courseId: string;
  moduleData?: CourseMaterial | null;
  onSuccess?: () => void;
}

export default function ModuleForm({ courseId, moduleData, onSuccess }: ModuleFormProps) {
  const router = useRouter();
  const isNew = !moduleData;
  const [title, setTitle] = useState(moduleData?.title ?? "");
  const [content, setContent] = useState(moduleData?.content ?? "");
  const [fileUrl, setFileUrl] = useState(moduleData?.file_url ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title || !content) {
      alert("Judul dan isi modul wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const sections = await getCourseSections(courseId);
        const urutan = sections.length > 0 ? Math.max(...sections.map((s) => s.urutan)) + 1 : 1;
        await createCourseMaterial({
          course_id: courseId,
          title,
          content,
          file_url: fileUrl || undefined,
          urutan,
        });
      } else {
        await updateCourseMaterial(moduleData.id, { title, content, file_url: fileUrl || undefined });
      }
      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan modul");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleData) { router.push(`/admin/course/${courseId}`); return; }
    if (!window.confirm("Yakin ingin menghapus modul ini?")) return;
    setSaving(true);
    try {
      await deleteCourseMaterial(moduleData.id);
      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus modul");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        <i className="fas fa-file-alt text-[#005696] mr-3"></i>
        {isNew ? "Tambah Modul Baru" : "Edit Modul"}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Modul</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="contoh: Pentingnya Menjaga Kesehatan Reproduksi"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Isi Modul</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Tulis materi di sini..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] font-mono placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Pendukung <span className="text-gray-400 font-normal text-xs">(opsional)</span>
          </label>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            <i className="fas fa-info-circle mr-1"></i>
            Link Google Drive atau URL file langsung (PDF, DOC, ZIP, dll).
          </p>
        </div>

        <div className="flex items-center gap-4 pt-2">
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
            <i className={`fas ${moduleData ? "fa-trash" : "fa-times"}`}></i>
            {moduleData ? "Hapus" : "Batal"}
          </button>
        </div>
      </form>
    </div>
  );
}
