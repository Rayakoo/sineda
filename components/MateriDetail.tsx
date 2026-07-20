"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getCachedCourse, getCourseVideos, getCourseMaterials, getQuizzes, getCourseMinigames } from "@/services/courses";
import type { OrderedSection } from "@/types/course";
import { enrollCourse, updateProgress, getUserCourse, getUserQuizResults } from "@/services/userCourses";
import { getProxiedUrl } from "@/services/garage";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, CourseVideo, CourseMaterial, Quiz, CourseMinigame } from "@/types/course";
import { MINIGAME_TYPE_LABELS } from "@/services/course-minigames";

function getVideoEmbedUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}

export default function MateriDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [minigames, setCourseMinigames] = useState<CourseMinigame[]>([]);
  const [sections, setSections] = useState<OrderedSection[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [materiTab, setMateriTab] = useState<"materi" | "file">("materi");
  const [fileLoading, setFileLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeSection = sections[activeIdx];

  function getSectionData(sec: OrderedSection) {
    if (sec.type === "video") return videos.find((v) => v.id === sec.id) ?? null;
    if (sec.type === "materi") return materials.find((m) => m.id === sec.id) ?? null;
    if (sec.type === "quiz") return quizzes.find((q) => q.id === sec.id) ?? null;
    if (sec.type === "minigame") return minigames.find((g) => g.id === sec.id) ?? null;
    return null;
  }

  useEffect(() => {
    if (!courseId) return;
    const cachedCourse = getCachedCourse(courseId);
    Promise.all([
      cachedCourse ? Promise.resolve(cachedCourse) : getCourse(courseId),
      getCourseVideos(courseId),
      getCourseMaterials(courseId),
      getQuizzes(courseId),
      getCourseMinigames(courseId),
    ]).then(async ([c, vids, mats, quiz, mgs]) => {
      setCourse(c);
      setVideos(vids);
      setMaterials(mats);
      setQuizzes(quiz);
      setCourseMinigames(mgs);

      const combined: OrderedSection[] = [
        ...vids.map((v) => ({ type: "video" as const, id: v.id, title: v.title, urutan: v.urutan })),
        ...mats.map((m) => ({ type: "materi" as const, id: m.id, title: m.title, urutan: m.urutan })),
        ...quiz.map((q) => ({ type: "quiz" as const, id: q.id, title: q.title, urutan: q.urutan })),
        ...mgs.map((g) => ({ type: "minigame" as const, id: g.id, title: g.title, urutan: g.urutan })),
      ];
      combined.sort((a, b) => a.urutan - b.urutan);
      setSections(combined);

      const sectionParam = searchParams.get("section");
      if (sectionParam) {
        const idx = combined.findIndex((s) => s.id === sectionParam);
        if (idx >= 0) setActiveIdx(idx);
      } else if (user) {
        try {
          const uc = await getUserCourse(user.id, courseId);
          if (uc && uc.current_urutan > 0) {
            const idx = combined.findIndex((s) => s.urutan === uc.current_urutan);
            if (idx >= 0) setActiveIdx(idx);
          } else {
            await enrollCourse(user.id, courseId).catch(() => {});
          }
        } catch {}
      }

      if (user) {
        try {
          const passedIds: string[] = [];
          for (const q of quiz) {
            const results = await getUserQuizResults(user.id, q.id);
            if (results?.some((r) => r.passed)) passedIds.push(q.id);
          }
          setCompletedIds(passedIds);
        } catch {}
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId, user]);

  const handleSectionClick = async (idx: number) => {
    const sec = sections[idx];
    if (!sec) return;

    if (sec.type === "materi") {
      const mat = materials.find((m) => m.id === sec.id);
      if (mat?.file_url) setFileLoading(true);
      if (!mat?.content && mat?.file_url) {
        setMateriTab("file");
      } else {
        setMateriTab("materi");
      }
    }

    if (user) {
      try {
        const dbUc = await getUserCourse(user.id, courseId);
        const dbUrutan = dbUc?.current_urutan ?? 0;
        if (sec.urutan > dbUrutan) {
          await updateProgress(user.id, courseId, sec.urutan);
        }
      } catch {}
    }

    if (sec.type === "quiz") {
      router.push(`/course/${courseId}/${sec.id}`);
    } else if (sec.type === "minigame") {
      router.push(`/course/${courseId}/minigame/${sec.id}`);
    } else {
      setActiveIdx(idx);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="bg-[#E0F2FE] px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/">
          <img src="/logo_sineda.png" alt="SINEDA" className="h-8" />
        </Link>
        <Link
          href={`/course/${courseId}`}
          className="flex items-center gap-1 bg-[#005696] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#003d6e] transition-all shadow-sm"
        >
          <i className="fas fa-chevron-left text-xs"></i>
          Kembali
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`w-full bg-gray-200 rounded-3xl shadow-md relative border border-gray-200/50 ${activeSection?.type === "materi" ? "" : "overflow-hidden aspect-video"}`}>
            {!activeSection ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm bg-white rounded-3xl">
                Pilih materi dari daftar di samping
              </div>
            ) : activeSection.type === "video" ? (
              (() => {
                const vid = videos.find((v) => v.id === activeSection.id);
                if (!vid) return null;
                const rawUrl = vid.video_url;
                const url = getProxiedUrl(rawUrl) || rawUrl;
                const isMp4 = url?.match(/\.(mp4|webm)(\?|$)/i) || rawUrl?.includes("bucket-utama");
                if (isMp4) {
                  return (
                    <video className="w-full h-full object-contain bg-black" src={url} controls />
                  );
                }
                const embed = getVideoEmbedUrl(url);
                const base = embed || `https://www.youtube.com/embed/${url}`;
                const src = base.includes("youtube.com/embed") ? `${base}?autoplay=1` : base;
                return (
                  <iframe
                    className="w-full h-full"
                    src={src}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()
            ) : activeSection.type === "materi" ? (
              (() => {
                const mat = materials.find((m) => m.id === activeSection.id);
                if (!mat) return null;
                return (
                  <div className="w-full bg-white rounded-3xl flex flex-col">
                    <div className="p-6 md:p-10 pb-0">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{mat.title}</h2>
                      {mat.file_url && (
                        <div className="bg-blue-100 p-1 rounded-2xl flex items-center w-full mb-6">
                          {mat.content && (
                            <button
                              onClick={() => setMateriTab("materi")}
                              className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                                materiTab === "materi" ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
                              }`}
                            >
                              <i className="fas fa-file-alt text-xs"></i>
                              Materi
                            </button>
                          )}
                          <button
                            onClick={() => { setMateriTab("file"); setFileLoading(true); }}
                            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                              materiTab === "file" ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
                            }`}
                          >
                            <i className="fas fa-file text-xs"></i>
                            File
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="px-6 md:px-10 pb-6 md:pb-10 overflow-y-auto max-h-[60vh]">
                      {materiTab === "materi" && mat.content && (
                  <div
                    className="materi-content text-sm md:text-base text-gray-700 font-normal leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-blue-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: mat.content }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.tagName === "A") {
                              const href = (target as HTMLAnchorElement).getAttribute("href");
                              if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
                                e.preventDefault();
                                window.open(href, "_blank", "noopener,noreferrer");
                              }
                            }
                          }}
                        />
                      )}
                      {materiTab === "materi" && !mat.content && mat.file_url && (
                        <div className="text-sm text-gray-400 italic">Tidak ada teks materi.</div>
                      )}
                      {materiTab === "file" && mat.file_url && (
                        (() => {
                          const rawUrl = mat.file_url;
                          const proxied = getProxiedUrl(rawUrl);
                          const url = proxied || rawUrl;
                          const driveId = rawUrl.match(/\/file\/d\/([^/?#]+)/)?.[1];
                          const isPdf = rawUrl.match(/\.pdf(\?|$)/i) || url?.match(/\.pdf(\?|$)/i);
                          if (driveId) {
                            return (
                              <div className="relative">
                                {fileLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                                    <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                                <iframe src={`https://drive.google.com/file/d/${driveId}/preview`}
                                  className="w-full h-[70vh] rounded-xl border border-gray-200"
                                  title="File Preview"
                                  onLoad={() => setFileLoading(false)}
                                />
                              </div>
                            );
                          }
                          if (isPdf) {
                            return (
                              <div className="relative">
                                {fileLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                                    <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                                <iframe src={url}
                                  className="w-full h-[70vh] rounded-xl border border-gray-200"
                                  title="File Preview"
                                  onLoad={() => setFileLoading(false)}
                                />
                              </div>
                            );
                          }
                          return (
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-3 bg-[#005696] text-white text-sm font-bold rounded-xl hover:bg-[#003d6e] transition-all shadow-sm"
                            >
                              <i className="fas fa-download"></i>
                              Download File
                            </a>
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm text-gray-600 bg-white/50 border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <i className="fas fa-clock text-[#005696] text-xs"></i>
                  <span>Total Materi <strong className="font-bold text-gray-800">{sections.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-book-open text-[#005696] text-xs"></i>
                  <span>Selesai <strong className="font-bold text-gray-800">{completedIds.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-chart-bar text-[#005696] text-xs"></i>
                  <span>Progress <strong className="font-bold text-gray-800">{Math.round((completedIds.length / Math.max(sections.length, 1)) * 100)}%</strong></span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-gray-800">{course?.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  {course?.description || "Tidak ada deskripsi."}
                </p>
              </div>
            </div>
          </div>

          {course?.type === "interactive" && activeSection?.type !== "minigame" && minigames.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-800 mb-4">Minigame</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {minigames.map((mg) => (
                  <button
                    key={mg.id}
                    onClick={() => router.push(`/course/${courseId}/minigame/${mg.id}`)}
                    className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-left hover:bg-pink-100 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-gamepad text-pink-500 text-sm"></i>
                      <span className="text-xs font-bold text-gray-700">{mg.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      {MINIGAME_TYPE_LABELS[mg.type as keyof typeof MINIGAME_TYPE_LABELS] || mg.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          <div className="bg-[#E0F2FE] border border-blue-200 rounded-3xl overflow-hidden shadow-sm sticky top-24">
            <div className="bg-[#005696] text-white p-4 font-bold text-sm tracking-wide text-center">
              Daftar Materi: {course?.title || ""}
            </div>

            <div className="p-4 flex flex-col gap-6 max-h-[600px] overflow-y-auto no-scrollbar">
              {sections.length === 0 ? (
                <p className="text-xs text-blue-700/60 text-center py-8">Belum ada materi.</p>
              ) : (
                sections.map((sec, idx) => {
                  const isActive = activeIdx === idx;
                  const isCompleted = completedIds.includes(sec.id);
                  const IconMap: Record<string, string> = {
                    video: "fa-video text-blue-500",
                    materi: "fa-file-alt text-green-500",
                    quiz: "fa-question-circle text-purple-500",
                    minigame: "fa-gamepad text-orange-500",
                  };

                  return (
                    <div key={sec.id}>
                      <button
                        onClick={() => handleSectionClick(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all text-left ${
                          isActive
                            ? "bg-white border-[#005696] shadow-sm scale-[1.01]"
                            : "bg-[#E0F2FE] border-transparent hover:bg-white/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted ? "text-[#005696]" : "text-blue-700/40"
                          }`}>
                            {isCompleted ? (
                              <i className="fas fa-check-circle text-lg"></i>
                            ) : (
                              <i className={`fas ${IconMap[sec.type] || "fa-circle"} text-sm`}></i>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className={`text-xs font-bold leading-tight ${isActive ? "text-gray-800" : "text-gray-700"}`}>
                              {sec.title}
                            </span>
                            <span className="text-[10px] text-blue-700/60 font-semibold mt-0.5 capitalize">
                              {sec.type === "materi" ? "modul" : sec.type}
                            </span>
                          </div>
                        </div>

                        {sec.type === "quiz" && (
                          <span className="bg-purple-100 text-purple-600 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                            Quiz
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .materi-content * { font-family: inherit !important; }
      `}</style>
    </div>
  );
}
