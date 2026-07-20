"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { getCourse, getCachedCourse } from "@/services/courses";
import { getUserCourse, enrollCourse } from "@/services/userCourses";
import { useAuth } from "@/contexts/AuthContext";
import { transformImageUrl } from "@/lib/image";
import type { Course } from "@/types/course";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(getCachedCourse(courseId) ?? null);
  const [loading, setLoading] = useState(!getCachedCourse(courseId));
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    if (getCachedCourse(courseId)) {
      setCourse(getCachedCourse(courseId)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCourse(courseId).then((c) => {
      if (!active) return;
      setCourse(c);
      setLoading(false);
    });
    return () => { active = false };
  }, [courseId]);

  useEffect(() => {
    if (!user || !courseId) return;
    getUserCourse(user.id, courseId).then((uc) => {
      if (uc) {
        setIsEnrolled(true);
        setIsCompleted(uc.is_completed);
      }
    }).catch(() => {});
  }, [user, courseId]);

  const handleStart = async () => {
    if (course.type === 'unsolved_case') {
      router.push(`/unsolved-case/${course.id}`);
      return;
    }
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!isEnrolled) {
      try { await enrollCourse(user.id, courseId); } catch {}
    }
    router.push(`/course/${courseId}/materi`);
  };

  const today = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
      Course tidak ditemukan
    </div>
  );

  const requireAuth = course.category === "siswa";
  const courseLengthMinutes = (course.lessons || 0) * 30;

  const content = (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 bg-[#005696] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#003d6e] transition-all shadow-sm"
        >
          <i className="fas fa-chevron-left text-xs"></i>
          Kembali
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100">
          {course.image ? (
            <div className="w-full aspect-video bg-gray-100">
              <img src={transformImageUrl(course.image)} alt={course.title} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className={`w-full aspect-video ${course.color} flex items-center justify-center`}>
              <i className={`fas ${course.icon} text-6xl text-white/50`}></i>
            </div>
          )}

          <div className="p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{course.title}</h1>

            {course.description && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-8">{course.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-clock text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Durasi</span>
                </div>
                <p className="text-sm font-bold">{courseLengthMinutes} menit</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-book-open text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Modul</span>
                </div>
                <p className="text-sm font-bold">{course.lessons} modul</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-tag text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Kategori</span>
                </div>
                <p className="text-sm font-bold capitalize">{course.category}</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-graduation-cap text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Tipe</span>
                </div>
                <p className="text-sm font-bold capitalize">
                  {course.type === "interactive" ? "Interaktif" : course.type === "unsolved_case" ? "Kasus Misterius" : "Belajar Mandiri"}
                </p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-users text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Durasi</span>
                </div>
                <p className="text-sm font-bold">{course.duration || `${courseLengthMinutes} menit`}</p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-[#005696] mb-1">
                  <i className="fas fa-calendar text-xs"></i>
                  <span className="text-xs font-semibold uppercase tracking-wider">Mulai</span>
                </div>
                <p className="text-sm font-bold">{today}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStart}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#F7941E] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#e0861b] transition-all shadow-sm"
              >
                <i className="fas fa-play text-sm"></i>
                {isCompleted ? "Lihat Lagi" : isEnrolled ? "Lanjutkan" : "Mulai Belajar"}
                <i className="fas fa-arrow-right text-sm"></i>
              </button>
              <button
                onClick={() => router.push(`/course/${courseId}/sertifikat`)}
                className="inline-flex items-center justify-center gap-2 bg-[#005696] text-white px-6 py-4 rounded-2xl text-base font-bold hover:bg-[#003d6e] transition-all shadow-sm"
              >
                <i className="fas fa-certificate text-sm"></i>
                Sertifikat
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          Dibuat: {new Date(course.created_at).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </main>
    </div>
  );

  if (requireAuth) {
    return <AuthGuard>{content}</AuthGuard>;
  }
  return content;
}
