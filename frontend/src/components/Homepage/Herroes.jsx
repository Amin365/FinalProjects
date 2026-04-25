import React from 'react'
import { Link } from 'react-router'
import {
  ArrowRight, Users, BookOpen, Star, Zap,
  ChevronRight, Globe, Heart, TrendingUp,
} from 'lucide-react'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'
import HeroHeader from './HeroSections'
import Features from './Features'
import { AnimatedBeamDemo as HowWorks } from './HowWorks'
import Testomials from './Testomial'
import CallToaction from './CallToActions'
import Footers from './Footer'
import Faqs from './Faq'
import JoinClub from './JoinClub'

/* ── transition preset shared by animated groups  */
const transitionVariants = {
  item: {
    hidden:  { opacity: 0, filter: 'blur(10px)', y: 16 },
    visible: {
      opacity: 1, filter: 'blur(0px)', y: 0,
      transition: { type: 'spring', bounce: 0.25, duration: 1.4 },
    },
  },
}

/* ── tiny stat pill  */
const StatPill = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm">
    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
      <Icon size={15} className="text-orange-500" />
    </div>
    <div>
      <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
)

/* ── floating badge chip  */
const FloatingChip = ({ children, className = '' }) => (
  <div className={cn(
    'absolute bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-200',
    className
  )}>
    {children}
  </div>
)

/* ── cn helper (inline, no import needed)  */
const cn = (...cls) => cls.filter(Boolean).join(' ')

/* 
   MAIN EXPORT
 */
export default function HeroSection() {
  const [joinOpen, setJoinOpen] = React.useState(false)

  return (
    <>
      <HeroHeader />

      <main className="overflow-hidden mt-20">

       
        <section className="relative min-h-screen flex items-center pt-28 pb-20">

          {/* Background mesh */}
          <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            {/* main soft radial */}
            {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-orange-100/50 dark:bg-orange-900/10 blur-3xl" /> */}
            {/* top-right accent */}
            {/* <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-amber-200/30 dark:bg-amber-800/10 blur-2xl" /> */}
            {/* bottom-left accent */}
            {/* <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-orange-200/20 dark:bg-orange-800/10 blur-2xl" /> */}
            {/* subtle dot grid */}
            {/* <div
              className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            /> */}
          </div>

          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

              {/* ── LEFT: copy ─── */}
              <div className="flex-1 text-center lg:text-left">

                {/* Eyebrow badge */}
                <AnimatedGroup variants={transitionVariants}>
                  <button
                    onClick={() => setJoinOpen(true)}
                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 text-[12.5px] font-bold mb-7 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Become a volunteer — make a real difference
                    <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </AnimatedGroup>

                {/* Headline */}
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="text-[40px] md:text-[52px] lg:text-[58px] font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight mb-6"
                >
                  Building Stronger Communities Through Collaboration
                </TextEffect>

                {/* Subheading with orange highlight */}
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.4}
                  as="p"
                  className="text-[17px] text-slate-500 dark:text-slate-400 leading-[1.8] max-w-xl mx-auto lg:mx-0 mb-10"
                >
                  Join our club to access a wealth of resources, connect with like-minded individuals, and make a positive impact in your community.
                </TextEffect>

                {/* CTA row */}
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: { transition: { staggerChildren: 0.07, delayChildren: 0.6 } },
                    },
                    ...transitionVariants,
                  }}
                  className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-12"
                >
                  <Link
                    to="/programmecards"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-extrabold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Explore Programs
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    onClick={() => setJoinOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 text-[14px] font-bold hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
                  >
                    <Heart size={14} className="text-orange-500" />
                    Join the Club
                  </button>
                </AnimatedGroup>

                {/* Social proof */}
                <AnimatedGroup variants={transitionVariants} className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <StatPill icon={Users}     value="2,400+" label="Active members" />
                  <StatPill icon={BookOpen}  value="6 live"  label="Programs now" />
                  <StatPill icon={Star}      value="4.8/5"   label="Avg rating" />
                </AnimatedGroup>
              </div>

              {/*  RIGHT: visual card  */}
              <div className="flex-1 relative hidden lg:flex items-center justify-center">
                {/* main card */}
                <div className="relative w-[380px] h-[440px]">

                  {/* Big background glow */}
                  <div className="absolute inset-8 rounded-3xl bg-orange-400/20 blur-2xl" />

                  {/* Main card */}
                  <div className="relative bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden w-full h-full flex flex-col">

                    {/* Card top band */}
                    <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-amber-500" />

                    <div className="flex flex-col flex-1 p-7 gap-5">
                      {/* card header */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
                          <Zap size={20} className="text-white fill-white" />
                        </div>
                        <div>
                          <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">DPL Community</p>
                          <p className="text-[11px] text-slate-400">Resource sharing platform</p>
                        </div>
                      </div>

                      {/* progress items */}
                      {[
                        { label: 'Full-stack development', pct: 85 },
                        { label: 'Data science & AI',       pct: 60 },
                        { label: 'Digital marketing',       pct: 45 },
                      ].map(({ label, pct }) => (
                        <div key={label}>
                          <div className="flex justify-between text-[12px] mb-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                            <span className="text-orange-500 font-bold">{pct}%</span>
                          </div>
                          <div className="h-2 w-full bg-orange-50 dark:bg-orange-900/20 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* member row */}
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-gray-800 pt-4">
                        <div className="flex -space-x-2">
                          {['AD', 'LH', 'SM', 'CV', 'JO'].map((initials) => (
                            <div
                              key={initials}
                              className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                            >
                              {initials}
                            </div>
                          ))}
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-orange-600">
                            +9k
                          </div>
                        </div>
                        <span className="text-[12px] text-slate-400 font-medium">Active learners</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating chips */}
                  <FloatingChip className="-top-5 -right-8 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp size={11} className="text-emerald-600" />
                    </div>
                    New program live!
                  </FloatingChip>

                  <FloatingChip className="-bottom-4 -left-8">
                    <div className="flex -space-x-1.5">
                      {['🟠','🟡','🔴'].map(e => <span key={e} className="text-[14px]">{e}</span>)}
                    </div>
                    <span>24 joined this week</span>
                  </FloatingChip>
                </div>
              </div>

            </div>
          </div>
        </section>

        <div className="relative">
          {/* soft divider */}
          <div className=" mx-12 mb-20" />

          <Features />
        </div>

        <div className="mb-12">
          <HowWorks clubLogoSrc="/jjuclub.jpg" />
        </div>

        <div className="mt-8">
          <Testomials />
        </div>

        <div className="mt-8">
          <Faqs />
        </div>

        <div className="mt-8 mb-32">
          <CallToaction />
        </div>

        <div className="relative flex flex-col mt-20">
          <Footers clubLogoSrc="/jjuclub.jpg" />
        </div>

        <JoinClub open={joinOpen} onOpenChange={setJoinOpen} />
      </main>
    </>
  )
}