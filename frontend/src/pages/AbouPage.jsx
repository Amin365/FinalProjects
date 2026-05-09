import {
  BookOpen, Users, Target, Heart, Award, Globe,
  ArrowRight, MapPin, Calendar, Star, Lightbulb,
  GraduationCap, BookMarked, Sparkles, CheckCircle2,
  TrendingUp, Library, Quote, ChevronRight,
} from "lucide-react";
import { Link } from "react-router";
import Footer from "../components/Homepage/Footer";
import HeroHeader from '../components/Homepage/HeroSections';


/* 
   DATA
 */
const STATS = [
  { value: "6+",      label: "Years of service",      icon: Calendar      },
  { value: "2,400+",  label: "Active members",        icon: Users         },
  { value: "15,000+", label: "Books in collection",   icon: BookOpen      },
  { value: "50+",     label: "Programmes run",        icon: GraduationCap },
];

const VALUES = [
  { icon: BookOpen,   title: "Free access for all",   desc: "Every resident of Degahbur deserves access to knowledge. Our doors are open to everyone regardless of background or ability to pay."        },
  { icon: Lightbulb, title: "Lifelong learning",      desc: "From children discovering their first story to adults acquiring new professional skills, we believe education has no age limit."           },
  { icon: Heart,      title: "Community first",       desc: "We are built by our community and exist for our community. Every programme is shaped by the needs and voices of Degahbur's people."       },
  { icon: Globe,      title: "Inclusive knowledge",   desc: "Our collection reflects the diversity of human thought — local stories, global ideas, and every perspective in between."                 },
];

const MILESTONES = [
  { year: "2018", title: "Library founded",           desc: "Opened with a founding collection of 2,000 books and a vision to transform the community through reading." },
  { year: "2019", title: "First reading club",        desc: "Launched our flagship community reading programme, bringing together 80 members in the first year."         },
  { year: "2020", title: "Digital expansion",         desc: "Introduced digital resources and an online catalogue to keep the community connected."                       },
  { year: "2021", title: "Youth programme launch",    desc: "Started the Young Readers Initiative, reaching over 400 school-age children across Degahbur district."       },
  { year: "2022", title: "Skills for tomorrow",       desc: "Launched vocational and digital literacy workshops, training 300+ community members."                        },
  { year: "2023", title: "Regional recognition",      desc: "Received the regional excellence award for community impact in education and cultural preservation."          },
  { year: "2024", title: "Online platform launched",  desc: "Launched this digital platform — members can now access resources and join programmes from anywhere."        },
];

const TEAM = [
  { name: "Ahmed Hassan",    role: "Library Director",          initials: "AH", bg: "#fff7ed", color: "#c2410c" },
  { name: "Faadumo Abdi",   role: "Head of Programmes",        initials: "FA", bg: "#f0fdf4", color: "#15803d" },
  { name: "Omar Yusuf",     role: "Community Outreach Lead",   initials: "OY", bg: "#eff6ff", color: "#1d4ed8" },
  { name: "Asha Mohamud",   role: "Digital Resources Manager", initials: "AM", bg: "#faf5ff", color: "#7c3aed" },
];

const AWARDS = [
  { year: "2023", title: "Regional Excellence Award",  body: "Somali Regional Education Bureau", icon: Award  },
  { year: "2022", title: "Community Impact Prize",     body: "Ethiopia Library Association",      icon: Star   },
  { year: "2021", title: "Best Youth Programme",       body: "National Reading Foundation",       icon: Target },
];

const OFFERINGS = [
  { icon: BookOpen,       title: "Book lending",           desc: "Borrow from 15,000+ titles — free for every member."              },
  { icon: GraduationCap, title: "Learning programmes",     desc: "Courses in tech, design, and business led by local experts."       },
  { icon: Users,         title: "Community events",        desc: "Author talks, reading circles, workshops and cultural gatherings."  },
  { icon: Globe,         title: "Digital resources",       desc: "E-books and our full online platform — access from anywhere."      },
  { icon: Target,        title: "Youth initiatives",       desc: "Dedicated programmes for children to build lifelong reading habits." },
  { icon: Heart,         title: "Volunteer opportunities", desc: "Join our network and help shape the library's next chapter."        },
];

/* 
   HELPERS
 */
const OrangeLine = () => (
  <div className="w-12 h-1 rounded-full bg-orange-500 mb-6" />
);

const Tag = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-500 mb-4">
    <span className="w-4 h-px bg-orange-400 inline-block" />
    {children}
    <span className="w-4 h-px bg-orange-400 inline-block" />
  </span>
);

/* 
   PAGE
 */
export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white overflow-x-hidden">
<div className="mt-20">
<HeroHeader/>

</div>

      {/* 
          HERO — full-viewport editorial
       */}
      <section className="relative min-h-screen flex flex-col justify-center pt-32 pb-20 px-6 md:px-12 lg:px-20">

        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-orange-50 dark:bg-orange-950/20 blur-[120px] opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-50 dark:bg-amber-950/10 blur-[100px] opacity-40" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{ backgroundImage: "linear-gradient(var(--tw-border-opacity,1) 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          {/* Edition label */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 max-w-[60px] bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Degahbur · Est. 2018
            </span>
          </div>

          {/* Giant headline */}
          <div className="mb-10">
            <h4 className="text-[clamp(42px,7vw,96px)] font-black text-slate-900 dark:text-white leading-[0.95] tracking-[-0.03em]">
              Where{" "}
              <em className="not-italic text-orange-500">knowledge</em>
              <br />
              meets{" "}
              <span className="relative inline-block">
                community
                {/* hand-drawn underline */}
                <svg className="absolute -bottom-3 left-0 w-full overflow-visible" viewBox="0 0 400 12" preserveAspectRatio="none" height="12">
                  <path d="M4 8 C60 3, 120 11, 200 7 C280 3, 340 10, 396 7" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
                </svg>
              </span>
            </h4>
          </div>

          {/* Two-col below headline */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 items-end mt-16">
            <div>
              <p className="text-[18px] md:text-[20px] text-slate-500 dark:text-slate-400 leading-[1.7] max-w-2xl font-light">
                Degahbur Public Library has been a beacon of free, open knowledge since{" "}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">2018</strong> —
                providing every resident with books, programmes, digital resources, and a community
                that learns and grows together.
              </p>

              <div className="flex flex-wrap gap-4 mt-10">
                <Link to="/programmecards"
                  className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[15px] font-bold shadow-2xl shadow-orange-300/40 dark:shadow-orange-900/40 transition-all duration-200 hover:gap-4">
                  Explore programmes
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/blogs"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[15px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200">
                  <BookMarked size={15} className="text-orange-500" /> Read our stories
                </Link>
              </div>
            </div>

            {/* Stat block — no background card */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label}
                  className="border border-slate-100 dark:border-white/10 rounded-3xl p-6 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 group">
                  <Icon size={18} className="text-orange-500 mb-3" />
                  <p className="text-[40px] font-black text-slate-900 dark:text-white leading-none tracking-tight mb-1 group-hover:text-orange-500 transition-colors duration-300">{value}</p>
                  <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 
          MISSION — no background, editorial quote style
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 items-start">
            {/* Label column */}
            <div className="pt-2">
              <Tag>Our mission</Tag>
            </div>
            {/* Quote */}
            <div className="relative">
              <Quote size={64} className="text-orange-200 dark:text-orange-900/60 absolute -top-4 -left-4 rotate-180" />
              <blockquote className="relative pl-8 border-l-4 border-orange-500">
                <p className="text-[26px] md:text-[34px] font-semibold text-slate-800 dark:text-white leading-[1.3] tracking-tight">
                  To empower every individual in Degahbur with{" "}
                  <span className="text-orange-500">free access to knowledge</span>,
                  culture, and the tools to build a better future.
                </p>
              </blockquote>
              {/* 4 pillars below */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-12 pl-8">
                {[
                  { icon: BookOpen,       label: "Free resources" },
                  { icon: GraduationCap, label: "Education"       },
                  { icon: Users,         label: "Community"       },
                  { icon: Globe,         label: "Digital access"  },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-orange-500" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          TIMELINE
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 bg-slate-50 dark:bg-white/[0.02] border-t border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16">
            {/* sticky heading */}
            <div className="lg:sticky lg:top-28 self-start">
              <Tag>Our story</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[44px] font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
                Six years of<br />
                <span className="text-orange-500">impact</span>
              </h2>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">
                From a small reading room in 2018 to a thriving community hub — the story of how we got here.
              </p>
            </div>

            {/* timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-orange-400 via-orange-300 to-transparent dark:from-orange-700 dark:via-orange-800" />
              <div className="flex flex-col gap-0">
                {MILESTONES.map((m, i) => (
                  <div key={m.year} className="relative flex gap-8 pb-10 last:pb-0 group">
                    {/* node */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0a0a0a] border-2 border-orange-500 flex items-center justify-center shadow-lg shadow-orange-100 dark:shadow-orange-950/50 group-hover:bg-orange-500 transition-colors duration-200">
                        <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:bg-white transition-colors duration-200" />
                      </div>
                    </div>
                    {/* content */}
                    <div className="flex-1 pb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-orange-500 mb-1 block">{m.year}</span>
                      <h4 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-orange-500 transition-colors duration-200">{m.title}</h4>
                      <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          AWARDS — large, attractive cards
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <Tag>Recognition</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[48px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Honoured for our<br />
                <span className="text-orange-500">community work</span>
              </h2>
            </div>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed md:text-right">
              Recognised at regional and national level for our commitment to education and cultural development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AWARDS.map((award, i) => {
              const Icon = award.icon;
              const featured = i === 0;
              return (
                <div key={award.title}
                  className={`relative rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-2
                    ${featured
                      ? "bg-orange-500 text-white shadow-2xl shadow-orange-300/30 dark:shadow-orange-900/40"
                      : "border border-slate-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/40 bg-white dark:bg-white/[0.03]"
                    }`}
                  style={{ minHeight: 300 }}
                >
                  {featured && (
                    <>
                      {/* noise texture */}
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                      {/* large icon watermark */}
                      <div className="absolute -bottom-8 -right-8 opacity-10">
                        <Icon size={160} className="text-white" />
                      </div>
                    </>
                  )}

                  <div className="relative p-8 md:p-10 flex flex-col h-full gap-6">
                    {/* year pill */}
                    <div className={`self-start text-[11px] font-extrabold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full
                      ${featured
                        ? "bg-white/20 text-white"
                        : "bg-orange-50 dark:bg-orange-950/40 text-orange-500"
                      }`}>
                      {award.year}
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                      ${featured ? "bg-white/20" : "bg-orange-50 dark:bg-orange-950/30"}`}>
                      <Icon size={26} className={featured ? "text-white" : "text-orange-500"} />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <h3 className={`text-[20px] md:text-[22px] font-extrabold leading-snug
                        ${featured ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {award.title}
                      </h3>
                      <p className={`text-[13px] font-semibold
                        ${featured ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                        {award.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
          VALUES
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <Tag>Our values</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[44px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Principles we<br />
                <span className="text-orange-500">live by</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-white/10 rounded-3xl overflow-hidden">
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={v.title}
                    className="group bg-white dark:bg-[#0f0f0f] p-8 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors duration-300 flex flex-col gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300">
                      <Icon size={20} className="text-orange-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{v.title}</h3>
                    <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 
          TEAM
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-14">
            <div>
              <Tag>The team</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[48px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Meet our<br />
                <span className="text-orange-500">leadership</span>
              </h2>
            </div>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed md:text-right">
              Dedicated librarians, educators, and community leaders shaping the future of Degahbur.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((m) => (
              <div key={m.name}
                className="group relative border border-slate-100 dark:border-white/10 rounded-3xl p-7 hover:border-orange-300 dark:hover:border-orange-500/40 hover:-translate-y-1.5 transition-all duration-300 bg-white dark:bg-white/[0.02] overflow-hidden">
                {/* hover top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-t-3xl" />

                {/* Big initial */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[22px] font-black mb-5 transition-all duration-300 group-hover:scale-105"
                  style={{ background: m.bg, color: m.color }}>
                  {m.initials}
                </div>
                <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white mb-1">{m.name}</h4>
                <p className="text-[12.5px] text-slate-400 dark:text-slate-500 leading-snug">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          OFFERINGS — asymmetric list
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <Tag>What we offer</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[44px] font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
                Everything you<br />
                need to{" "}
                <span className="text-orange-500">grow</span>
              </h2>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                From borrowing books to joining professional development programmes — Degahbur Public Library is your complete learning partner.
              </p>
              <Link to="/programmecards"
                className="group inline-flex items-center gap-2 text-[14px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                Browse all programmes
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* 3-col feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
              {OFFERINGS.map((o, i) => {
                const Icon = o.icon;
                return (
                  <div key={o.title}
                    className={`group p-7 flex flex-col gap-3 hover:bg-white dark:hover:bg-white/[0.04] transition-colors duration-200
                      ${i % 2 === 0 ? "border-b border-slate-200 dark:border-white/10" : "border-b border-l border-slate-200 dark:border-white/10"}
                      ${i >= OFFERINGS.length - 2 ? "border-b-0" : ""}
                    `}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-orange-500 flex items-center justify-center transition-colors duration-200 shrink-0">
                      <Icon size={17} className="text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h4 className="text-[14.5px] font-extrabold text-slate-900 dark:text-white">{o.title}</h4>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{o.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 
          LOCATION + HOURS
       */}
      <section className="py-28 px-6 md:px-12 lg:px-20 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-14">
            <div>
              <Tag>Visit us</Tag>
              <OrangeLine />
              <h2 className="text-[36px] md:text-[48px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Come say{" "}
                <span className="text-orange-500">hello</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center">
                  <MapPin size={17} className="text-white" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Location & contact</h3>
              </div>
              <div className="space-y-4 text-[14px] text-slate-600 dark:text-slate-300">
                {[
                  { label: "Address", value: "Main Street, Degahbur Town Centre\nDegahbur District, Somali Region, Ethiopia" },
                  { label: "Phone",   value: "+251 XXX XXX XXX" },
                  { label: "Email",   value: "info@degahburlibrary.et" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-500 mt-0.5 w-16 shrink-0">{label}</span>
                    <span className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center">
                  <Calendar size={17} className="text-white" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Opening hours</h3>
              </div>
              <div className="space-y-0">
                {[
                  { day: "Monday – Friday", hours: "8:00 AM – 7:00 PM", open: true  },
                  { day: "Saturday",        hours: "9:00 AM – 5:00 PM", open: true  },
                  { day: "Sunday",          hours: "Closed",            open: false },
                  { day: "Public holidays", hours: "Closed",            open: false },
                ].map(({ day, hours, open }) => (
                  <div key={day}
                    className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{day}</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <span className={`text-[13.5px] font-bold ${open ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {hours}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          FINAL CTA — clean, type-forward
       */}
      <section className="py-32 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="border border-slate-200 dark:border-white/10 rounded-3xl p-10 md:p-16 relative overflow-hidden hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors duration-500">
            {/* Background accent */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-orange-50 dark:bg-orange-950/20 blur-3xl" />
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div>
                <Tag>Join us</Tag>
                <h4 className="text-[36px] md:text-[56px] font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
                  Your library.<br />
                  Your <span className="text-orange-500">community</span>.<br />
                  Your future.
                </h4>
                <p className="text-[16px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                  Join thousands of Degahbur residents who are learning, growing, and connecting every day. Membership is — and always will be — completely free.
                </p>
              </div>

              <div className="flex flex-col gap-4 shrink-0">
                <Link to="/programmecards"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-[15px] font-bold shadow-2xl shadow-orange-300/30 dark:shadow-orange-900/30 transition-all duration-200 whitespace-nowrap">
                  Explore programmes
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/volunteer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[15px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 whitespace-nowrap">
                  <Heart size={15} className="text-orange-500 fill-orange-500" />
                  Become a volunteer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-20">
    <Footer clubLogoSrc="/jjuclub.jpg" />  
    
        </div>


    </div>
  );
}