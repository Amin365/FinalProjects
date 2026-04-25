import {
  BookOpen, Users, CalendarDays, NotebookPen,
  LibraryBig, BadgeCheck, ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: LibraryBig,
    title: "Borrow Books",
    desc: "Explore the club library, request a title, and track borrowed books with due dates.",
    tag: "Library",
  },
  {
    icon: CalendarDays,
    title: "Weekly Reading Sessions",
    desc: "Join scheduled meetups, discussions, and live Q&A sessions with fellow members.",
    tag: "Sessions",
  },
  {
    icon: NotebookPen,
    title: "Reviews & Notes",
    desc: "Write reviews, save quotes, and keep personal reading notes for every book you finish.",
    tag: "Notes",
  },
  {
    icon: BookOpen,
    title: "Curated Reading Lists",
    desc: "Discover themed reading lists and recommendations handpicked by the community.",
    tag: "Discovery",
  },
  {
    icon: Users,
    title: "Community & Events",
    desc: "Participate in challenges, author spotlights, and community reading goals.",
    tag: "Community",
  },
  {
    icon: BadgeCheck,
    title: "Progress & Badges",
    desc: "Track your activity and earn badges for reading streaks and contributions.",
    tag: "Gamification",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-24 overflow-hidden"
    >
      
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-200 dark:via-orange-800/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-200 dark:via-orange-800/40 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-orange-50/80 dark:bg-orange-900/10 blur-3xl" />
         */}
      </div>

      <div className="mx-auto max-w-6xl px-6">

        {/* ── section header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            {/* eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 text-[11.5px] font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              What we offer
            </div>
            <h2 className="text-[36px] md:text-[44px] font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Everything your{" "}
              <span className="relative inline-block">
                <span className="text-orange-500">DPL</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full overflow-visible"
                  height="6" viewBox="0 0 200 6" preserveAspectRatio="none"
                >
                  <path
                    d="M0 4 Q25 1 50 4 Q75 7 100 4 Q125 1 150 4 Q175 7 200 4"
                    stroke="#f97316" strokeWidth="2.5" fill="none"
                    strokeLinecap="round" opacity="0.7"
                  />
                </svg>
              </span>{" "}
              needs
            </h2>
          </div>

          <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm md:text-right">
            Borrow books, join sessions, share reviews, and grow together — built for readers who want more.
          </p>
        </div>

        {/* ── feature grid ──── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const isFeatured = i === 0; /* first card gets a special treatment */

            return (
              <div
                key={feature.title}
                className={`group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden
                  ${isFeatured
                    ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-2xl hover:-translate-y-1"
                    : "bg-white dark:bg-gray-900 border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* inner dot grid on featured card */}
                {isFeatured && (
                  <div
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                )}
                {/* top accent line on non-featured */}
                {!isFeatured && (
                  <div className="h-0.5 w-full bg-gradient-to-r from-orange-400/0 via-orange-400/60 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <div className="relative z-10 p-7 flex flex-col flex-1 gap-5">
                  {/* icon + tag row */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
                        ${isFeatured
                          ? "bg-white/20 backdrop-blur-sm"
                          : "bg-orange-50 dark:bg-orange-900/20"
                        }`}
                    >
                      <Icon
                        size={22}
                        className={isFeatured ? "text-white" : "text-orange-500"}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full
                        ${isFeatured
                          ? "bg-white/20 text-white/90"
                          : "bg-orange-50 dark:bg-orange-900/20 text-orange-500 border border-orange-100 dark:border-orange-800/40"
                        }`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  {/* text */}
                  <div className="flex-1">
                    <h3
                      className={`text-[16px] font-extrabold mb-2.5 leading-snug
                        ${isFeatured ? "text-white" : "text-slate-900 dark:text-white"}`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-[13.5px] leading-relaxed
                        ${isFeatured ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {feature.desc}
                    </p>
                  </div>

                  {/* bottom arrow link */}
                  <div
                    className={`flex items-center gap-1.5 text-[12px] font-bold mt-1 transition-all duration-200
                      ${isFeatured
                        ? "text-white/70 group-hover:text-white group-hover:gap-2.5"
                        : "text-orange-400 group-hover:text-orange-500 group-hover:gap-2.5"
                      }`}
                  >
                    Learn more
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── bottom CTA strip  */}
        {/* <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-5 px-8 py-6 rounded-3xl bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                Ready to start reading?
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Join 2,400+ members already in the club.
              </p>
            </div>
          </div>
          <a
            href="/programmecards"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore programs <ArrowRight size={14} />
          </a>
        </div> */}

      </div>
    </section>
  );
}