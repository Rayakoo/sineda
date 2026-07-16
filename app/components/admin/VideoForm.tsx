"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourseVideo, updateCourseVideo, deleteCourseVideo, getCourseSections } from "@/services/courses";
import type { CourseVideo } from "@/types/course";

interface VideoFormProps {
  courseId: string;
  videoData?: CourseVideo | null;
  onSuccess?: () => void;
}

export default function VideoForm({ courseId, videoData, onSuccess }: VideoFormProps) {
  const router = useRouter();
  const isNew = !videoData;
  const [title, setTitle] = useState(videoData?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(videoData?.video_url ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title || !videoUrl) {
      alert("Judul dan link video wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const sections = await getCourseSections(courseId);
        const urutan = sections.length > 0 ? Math.max(...sections.map((s) => s.urutan)) + 1 : 1;
        await createCourseVideo({
          course_id: courseId,
          title,
          video_url: videoUrl,
          urutan,
        });
      } else {
        await updateCourseVideo(videoData.id, { title, video_url: videoUrl });
      }
      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!videoData) { router.push(`/admin/course/${courseId}`); return; }
    if (!window.confirm("Yakin ingin menghapus video ini?")) return;
    setSaving(true);
    try {
      await deleteCourseVideo(videoData.id);
      onSuccess ? onSuccess() : router.push(`/admin/course/${courseId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        <i className="fas fa-video text-[#005696] mr-3"></i>
        {isNew ? "Tambah Video Baru" : "Edit Video"}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Video</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Petunjuk atau informasi tambahan"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link Video (YouTube/Google Drive)</label>
          <input
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] placeholder-gray-300"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            <i className="fas fa-info-circle mr-1"></i>
            YouTube, Google Drive, atau URL video langsung
          </p>
        </div>

        {videoUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              className="w-full h-full"
              src={videoUrl.replace("watch?v=", "embed/")}
              allowFullScreen
              title="Video preview"
            />
          </div>
        )}

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
            <i className={`fas ${videoData ? "fa-trash" : "fa-times"}`}></i>
            {videoData ? "Hapus" : "Batal"}
          </button>
        </div>
      </form>
    </div>
  );
}
