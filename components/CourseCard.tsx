import Link from "next/link";
import type { Course } from "@/types/course";
import { transformImageUrl } from "@/lib/image";

interface Props {
  course: Course;
  href?: string;
}

export default function CourseCard({ course, href }: Props) {
  const linkHref = href || `/course/${course.id}`;

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
          Mulai Belajar
        </div>
      </div>
    </Link>
  );
}
