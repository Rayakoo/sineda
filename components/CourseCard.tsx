import Link from "next/link";
import type { Course } from "@/types/course";
import { transformImageUrl } from "@/lib/image";

interface Props {
  course: Course;
  href?: string;
}

export default function CourseCard({ course, href }: Props) {
  const isUnsolvedCase = course.type === 'unsolved_case';
  const linkHref = href || (isUnsolvedCase ? `/unsolved-case/${course.id}` : `/course/${course.id}`);

  if (isUnsolvedCase) {
    return (
      <Link
        href={linkHref}
        className="block relative rounded-[30px] overflow-hidden border border-[#c4a882] bg-[#f8f1e5] shadow-[0_18px_38px_rgba(92,61,46,0.18)] hover:-translate-y-1 transition-all duration-300"
      >
        <div
          className="absolute left-0 right-0 top-0 z-20 h-7"
          style={{
            background: 'linear-gradient(180deg, #c4b098 0%, #b8a48a 100%)',
            clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
            borderBottom: '2px solid rgba(92,61,46,0.16)',
          }}
        />

        <div className="relative px-4 pt-8 pb-5 text-[#3c2415]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="rounded-full border border-[#d4c4a8] bg-[#f7f1df] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5c3d2e]">
              Surat Kasus
            </span>
            <span className="text-[10px] font-semibold text-[#8b7355] italic">Detektif</span>
          </div>

          <div
            className="relative overflow-hidden rounded-[22px] border-2 border-[#b8a48a] shadow-md"
            style={{
              background: 'linear-gradient(160deg, #d4c4a8 0%, #c4b098 50%, #d4c4a8 100%)',
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #5c3d2e 10px, #5c3d2e 11px)',
              }}
            />

            <div className="relative px-4 py-5 text-center">
              <p className="text-[10px] text-[#8b7355] font-mono uppercase tracking-[0.18em] mb-2">Judul Berkas</p>
              <h4 className="font-extrabold text-sm leading-snug text-[#3c2415] line-clamp-3 uppercase tracking-wider">
                {course.title}
              </h4>
              <div className="w-12 h-[2px] bg-[#8b7355]/35 mx-auto my-3" />
              <p className="text-[11px] text-[#5c3d2e] mt-2 line-clamp-4 leading-relaxed">
                {course.description}
              </p>
              <div className="mt-4 text-[10px] text-[#5c3d2e] font-bold font-mono uppercase tracking-[0.25em]">
                Sangat Rahasia
              </div>
              <p className="text-[11px] text-[#5c3d2e] mt-2 italic leading-relaxed font-medium">
                credit by paramytha magdalena sukarno putri and team
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[#8b7355] flex-wrap">
            <span className="rounded-full bg-[#e7dbc3] px-2.5 py-1 font-medium">Kasus Misterius</span>
            {course.lessons > 0 && <span>{course.lessons} Pelajaran</span>}
            {course.duration && <span>{course.duration}</span>}
          </div>

          <div className="mt-4 rounded-[16px] bg-[#5c3d2e] px-4 py-3 text-center text-white font-bold text-sm shadow-sm hover:bg-[#4c2f21] transition-colors">
            Mulai Investigasi
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={linkHref}
      className="block bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className={`h-44 shrink-0 ${course.image ? "" : course.color} flex items-center justify-center overflow-hidden`}>
        {course.image ? (
          <img src={transformImageUrl(course.image)} alt="" className="w-full h-full object-cover" />
        ) : (
          <i className={`fas ${course.icon} text-6xl text-white`}></i>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3 flex-wrap">
          <span className="bg-gray-100 px-2.5 py-1 rounded font-medium">
            {course.type === "interactive"
              ? "Interaktif"
              : course.type === "unsolved_case"
                ? "Kasus Misterius"
                : "Belajar Mandiri"}
          </span>
          {course.lessons > 0 && <span>{course.lessons} Pelajaran</span>}
          {course.duration && <span>{course.duration}</span>}
        </div>
        <h4 className="font-bold text-base leading-snug text-gray-800 line-clamp-2 min-h-[2.5rem]">
          {course.title}
        </h4>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1 min-h-[2.5rem]">
          {course.description}
        </p>
        <div className="w-full py-3 bg-[#F7941E] text-white rounded-xl font-bold hover:bg-[#e0861b] transition text-sm text-center mt-4 shrink-0">
          {course.type === 'unsolved_case' ? 'Mulai Investigasi' : 'Mulai Belajar'}
        </div>
      </div>
    </Link>
  );
}
