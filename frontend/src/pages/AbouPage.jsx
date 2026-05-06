
import {
  BookOpen, Users, Target, Heart, Award, Globe,
  ArrowRight, MapPin, Calendar, Star, Lightbulb,
  GraduationCap, BookMarked, Sparkles, CheckCircle2,
  TrendingUp, Library,
} from "lucide-react";

/* 
   DATA
 */
const STATS = [
  { value: "6+",    label: "Years of service",    icon: Calendar    },
  { value: "2,400+", label: "Active members",     icon: Users       },
  { value: "15,000+", label: "Books in collection", icon: BookOpen  },
  { value: "50+",   label: "Programs run",         icon: GraduationCap },
];

const VALUES = [
  {
    icon: BookOpen,
    title: "Free access for all",
    desc: "Every resident of Degahbur deserves access to knowledge. Our doors are open to everyone regardless of background or ability to pay.",
  },
  {
    icon: Lightbulb,
    title: "Lifelong learning",
    desc: "From children discovering their first story to adults acquiring new professional skills, we believe education has no age limit.",
  },
  {
    icon: Heart,
    title: "Community first",
    desc: "We are built by our community and exist for our community. Every programme we run is shaped by the needs and voices of Degahbur's people.",
  },
  {
    icon: Globe,
    title: "Inclusive knowledge",
    desc: "Our collection reflects the diversity of human thought and experience — local stories, global ideas, and every perspective in between.",
  },
];

const MILESTONES = [
  { year: "2018", title: "Library founded", desc: "Degahbur Public Library opened its doors with a founding collection of 2,000 books and a vision to transform the community through reading." },
  { year: "2019", title: "First reading club", desc: "Launched our flagship community reading programme, bringing together 80 members in the first year." },
  { year: "2020", title: "Digital expansion", desc: "Introduced digital resources and an online catalogue to keep our community connected during challenging times." },
  { year: "2021", title: "Youth programme launch", desc: "Started the Young Readers Initiative, reaching over 400 school-age children across Degahbur district." },
  { year: "2022", title: "Skills for tomorrow", desc: "Launched vocational and digital literacy workshops, training 300+ community members in technology and entrepreneurship." },
  { year: "2023", title: "Regional recognition", desc: "Received regional excellence award for community impact in education and cultural preservation." },
  { year: "2024", title: "Online platform", desc: "Launched this digital platform to extend our reach — members can now access resources, join programmes, and connect from anywhere." },
];

const TEAM = [
  { name: "Ahmed Hassan",   role: "Library Director",        initials: "AH", bg: "#fff0e6", color: "#c2410c" },
  { name: "Faadumo Abdi",  role: "Head of Programmes",      initials: "FA", bg: "#f0fdf4", color: "#15803d" },
  { name: "Omar Yusuf",    role: "Community Outreach Lead",  initials: "OY", bg: "#f0f9ff", color: "#0369a1" },
  { name: "Asha Mohamud",  role: "Digital Resources Manager",initials: "AM", bg: "#fdf4ff", color: "#7e22ce" },
];

/* 
   SMALL COMPONENTS
 */

/* Section eyebrow */
const Eyebrow = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 text-[11px] font-extrabold uppercase tracking-widest mb-5">
    <Sparkles size={11} className="fill-orange-400" />
    {children}
  </div>
);

/* Section heading */
const SectionHead = ({ eyebrow, title, sub, center = false }) => (
  <div className={`mb-12 ${center ? "text-center" : ""}`}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="text-[34px] md:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-4">
      {title}
    </h2>
    {sub && <p className="text-[16px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">{sub}</p>}
  </div>
);

/* Orange squiggle underline */
const Squiggle = ({ width = 200 }) => (
  <svg className="overflow-visible" width={width} height="8" viewBox={`0 0 ${width} 8`} preserveAspectRatio="none">
    <path d={`M0 5 Q${width*0.25} 1 ${width*0.5} 5 Q${width*0.75} 9 ${width} 5`}
      stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
  </svg>
);

/* 
   PAGE
 */
export default function AboutPages() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">

      {/* 
          HERO
       */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-orange-100/50 dark:bg-orange-900/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-amber-100/40 dark:bg-amber-900/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 text-[12.5px] font-bold mb-8">
                <MapPin size={13} />
                Degahbur, Somali Region, Ethiopia
              </div>

              <h1 className="text-[44px] md:text-[58px] font-extrabold text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6">
                Where knowledge{" "}
                <span className="relative inline-block">
                  <span className="text-orange-500">meets community</span>
                  <span className="absolute -bottom-2 left-0 w-full"><Squiggle width={340} /></span>
                </span>
              </h1>

              <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-[1.8] max-w-xl mb-10">
                Degahbur Public Library has been a beacon of free, open knowledge since 2018 — providing every resident with access to books, programmes, digital resources, and a community that grows together.
              </p>

              <div className="flex flex-wrap gap-4">
                <a href="/programmecards"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-extrabold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Explore programmes
                  <ArrowRight size={15} />
                </a>
                <a href="/blogs"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 text-[14px] font-bold hover:bg-slate-50 dark:hover:bg-gray-800 transition-all">
                  <BookMarked size={15} className="text-orange-500" />
                  Our stories
                </a>
              </div>
            </div>

            {/* Right: visual card */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-[380px]">
                {/* Glow */}
                <div className="absolute inset-6 rounded-3xl bg-orange-200/30 blur-2xl" />

                {/* Main card */}
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-2xl shadow-black/10 overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-amber-500" />
                  <div className="p-7">
                    {/* Library icon */}
                    <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 mb-5">
                      <Library size={26} className="text-white" />
                    </div>
                    <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-1">Degahbur Public Library</h3>
                    <p className="text-[13px] text-orange-500 font-bold mb-5">Est. 2018 · Free & Open to All</p>

                    {/* Mini stats */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {STATS.map(({ value, label, icon: Icon }) => (
                        <div key={label} className="p-3 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                          <p className="text-[22px] font-extrabold text-orange-500 leading-none">{value}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                        Open Mon–Sat · 8:00 AM – 7:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating chips */}
                <div className="absolute -top-4 -right-6 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  Regional award 2023
                </div>
                <div className="absolute -bottom-4 -left-6 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                  <Users size={13} className="text-orange-500" />
                  2,400+ active members
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          MISSION BAND
       */}
      <section className="bg-orange-500 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }} />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-100 mb-4">Our mission</p>
          <h2 className="text-[28px] md:text-[38px] font-extrabold text-white leading-tight max-w-3xl mx-auto">
            "To empower every individual in Degahbur with free access to knowledge, culture, and the tools to build a better future."
          </h2>
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { icon: BookOpen, label: "Free resources" },
              { icon: GraduationCap, label: "Education programmes" },
              { icon: Users, label: "Community events" },
              { icon: Globe, label: "Digital access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/90 text-[14px] font-semibold">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={15} className="text-white" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          STORY / HISTORY
       */}
      <section className="py-24 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-16">

            {/* Left: copy */}
            <div className="lg:w-[400px] shrink-0 lg:sticky lg:top-28">
              <SectionHead
                eyebrow="Our story"
                title={<>Six years of{" "}<span className="text-orange-500">impact</span></>}
                sub="From a small reading room in 2018 to a thriving community hub — here is how we got here."
              />
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">Growing every year</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Membership grew 40% in 2024 alone.</p>
                </div>
              </div>
            </div>

            {/* Right: timeline */}
            <div className="flex-1 relative">
              {/* vertical line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200 dark:bg-gray-800" />

              <div className="flex flex-col gap-0">
                {MILESTONES.map((m, i) => (
                  <div key={m.year} className="relative flex gap-6 pb-10 last:pb-0">
                    {/* dot */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                        <span className="text-[10px] font-extrabold text-white">{m.year.slice(2)}</span>
                      </div>
                    </div>
                    {/* card */}
                    <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5 hover:border-orange-200 dark:hover:border-orange-800/60 hover:shadow-md transition-all duration-200">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-500 mb-1">{m.year}</p>
                      <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white mb-2">{m.title}</h4>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          VALUES
       */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <Eyebrow>What we stand for</Eyebrow>
            <h2 className="text-[34px] md:text-[44px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Built on{" "}
              <span className="relative">
                <span className="text-orange-500">shared values</span>
                <span className="absolute -bottom-2 left-0 w-full"><Squiggle width={260} /></span>
              </span>
            </h2>
            <p className="mt-5 text-[16px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Everything we do flows from a simple belief: knowledge should be free, accessible, and transformative for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              const featured = i === 0;
              return (
                <div key={v.title}
                  className={`relative rounded-3xl p-7 overflow-hidden flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1
                    ${featured
                      ? "bg-orange-500 text-white shadow-xl shadow-orange-200 dark:shadow-orange-900/30"
                      : "bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-md"
                    }`}
                >
                  {featured && (
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
                  )}
                  <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center
                    ${featured ? "bg-white/20" : "bg-orange-50 dark:bg-orange-900/20"}`}>
                    <Icon size={22} className={featured ? "text-white" : "text-orange-500"} />
                  </div>
                  <h3 className={`text-[17px] font-extrabold relative ${featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {v.title}
                  </h3>
                  <p className={`text-[14px] leading-relaxed relative ${featured ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
          STATS ROW
       */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900/50 border-y border-slate-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-800/60 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-orange-500" />
                </div>
                <p className="text-[38px] font-extrabold text-orange-500 leading-none mb-1">{value}</p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          TEAM
       */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <Eyebrow>The people behind it</Eyebrow>
            <h2 className="text-[34px] md:text-[44px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Meet our <span className="text-orange-500">leadership</span>
            </h2>
            <p className="mt-4 text-[15px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              A dedicated team of librarians, educators, and community leaders committed to Degahbur's future.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(member => (
              <div key={member.name}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* Color top */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400/0 via-orange-400 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[18px] font-extrabold mb-4 shadow-sm"
                    style={{ background: member.bg, color: member.color }}>
                    {member.initials}
                  </div>
                  <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white mb-1">{member.name}</h4>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          WHAT WE OFFER
       */}
      <section className="py-24 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-[420px] shrink-0">
              <SectionHead
                eyebrow="What we offer"
                title={<>Everything you need to <span className="text-orange-500">grow</span></>}
                sub="From borrowing books to joining professional development programmes — Degahbur Public Library is your complete learning partner."
              />
              <a href="/programmecards"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-extrabold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02]">
                Browse all programmes <ArrowRight size={14} />
              </a>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: BookOpen,       title: "Book lending",           desc: "Borrow from 15,000+ titles in our curated collection — free for every member." },
                { icon: GraduationCap, title: "Learning programmes",     desc: "Structured courses in tech, design, business, and more — led by local experts." },
                { icon: Users,         title: "Community events",        desc: "Author talks, reading circles, workshops and cultural celebrations." },
                { icon: Globe,         title: "Digital resources",       desc: "Online catalogue, e-books, and our new digital platform — access from anywhere." },
                { icon: Target,        title: "Youth initiatives",       desc: "Dedicated programmes for children and young adults to build lifelong reading habits." },
                { icon: Award,         title: "Volunteer opportunities", desc: "Join our volunteer network and help shape the next chapter of the library." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-800/60 hover:shadow-sm transition-all duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-500 transition-colors duration-200">
                    <Icon size={17} className="text-orange-500 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white mb-1">{title}</h4>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 
          LOCATION + HOURS
       */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Location card */}
            <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                  <MapPin size={17} className="text-white" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Find us</h3>
              </div>
              <div className="space-y-3 text-[14px] text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-slate-800 dark:text-white">Address:</span> Main Street, Degahbur Town Centre<br />Degahbur District, Somali Region, Ethiopia</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-slate-800 dark:text-white">Phone:</span> +251 XXX XXX XXX</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <span><span className="font-semibold text-slate-800 dark:text-white">Email:</span> info@degahburlibrary.et</span>
                </div>
              </div>
            </div>

            {/* Hours card */}
            <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                  <Calendar size={17} className="text-white" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Opening hours</h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Monday – Friday", hours: "8:00 AM – 7:00 PM", open: true  },
                  { day: "Saturday",        hours: "9:00 AM – 5:00 PM", open: true  },
                  { day: "Sunday",          hours: "Closed",            open: false },
                  { day: "Public holidays", hours: "Closed",            open: false },
                ].map(({ day, hours, open }) => (
                  <div key={day} className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-gray-700 last:border-0">
                    <span className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">{day}</span>
                    <span className={`text-[13px] font-bold ${open ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          FINAL CTA
       */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "30px 30px" }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <BookOpen size={28} className="text-white" />
          </div>
          <h2 className="text-[34px] md:text-[44px] font-extrabold text-white leading-tight mb-4">
            Your community library awaits
          </h2>
          <p className="text-[16px] text-white/80 leading-relaxed mb-10 max-w-xl mx-auto">
            Join thousands of Degahbur residents who are learning, growing, and connecting at our library every day. Membership is free — always.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/programmecards"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-orange-600 text-[15px] font-extrabold shadow-xl hover:bg-orange-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Explore programmes <ArrowRight size={15} />
            </a>
            <a href="/team"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border-2 border-white/50 text-white text-[15px] font-bold hover:bg-white/10 transition-all">
              <Heart size={15} className="fill-white" />
              Become a volunteer
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}