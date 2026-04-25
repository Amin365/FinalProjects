import { useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Flame, Calendar, Star, TrendingUp, Award, ChevronRight, Download, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/app/api/apislice';
import { useSelector } from 'react-redux';




// Counter animation component
function AnimatedCounter({ value, duration = 2, instant = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (instant) {
      setCount(value);
      return undefined;
    }
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, instant]);

  return <span>{instant ? value : count}</span>;
}

export default function ReadingRecaps() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const user = useSelector((state) => state.auth?.user);
  const displayName = useMemo(() => {
    const raw = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (!raw) return 'Reader';
    if (raw.includes('@')) return raw.split('@')[0];
    const parts = raw.trim().split(' ').filter(Boolean);
    return parts[0] || raw;
  }, [user]);
  const rawRole = (
    user?.role?.name ??
    user?.role?.role ??
    user?.role ??
    user?.roles?.[0]?.name ??
    user?.roles?.[0]?.role ??
    ''
  );
  const roleName = String(rawRole).toLowerCase().trim();
  const isSuperAdmin = /super\s*admin/.test(roleName) || roleName.includes('admin');
  const nowDate = new Date();
  const currentDay = nowDate.getDate();
  const lastDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();
  const withinMemberWindow = currentDay <= 5 || currentDay === lastDayOfMonth;
  const canViewRecap = isSuperAdmin || withinMemberWindow;
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  const monthName = new Date().toLocaleString('default', { month: 'long' });
  const year = new Date().getFullYear();

  const { data: reportsResp = [], isLoading: loadingReports } = useQuery({
    queryKey: ['dailyReports', isSuperAdmin ? 'all' : 'scope'],
    queryFn: async () => {
      const url = isSuperAdmin ? '/daily-reports' : '/daily-reports/scope';
      const res = await api.get(url);
      return res.data?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: issuesResp = [] } = useQuery({
    queryKey: ['issues', isSuperAdmin ? 'all' : 'my'],
    queryFn: async () => {
      const url = isSuperAdmin ? '/issue' : '/issues/my';
      const res = await api.get(url, { params: { limit: 1000 } });
      return res.data?.data || res.data?.items || [];
    },
    staleTime: 60_000,
  });

  const { data: booksResp = [] } = useQuery({
    queryKey: ['books', 'recap'],
    queryFn: async () => {
      const res = await api.get('/books');
      return res.data?.data || res.data || [];
    },
    staleTime: 300_000,
  });

  // Fetch monthly comparison data from reporting API
  const { data: monthlyComparisonResp } = useQuery({
    queryKey: ['reporting', 'monthly-comparison'],
    queryFn: async () => {
      const res = await api.get('/reporting/monthly-comparison');
      return res.data?.data || {};
    },
    staleTime: 120_000,
    enabled: canViewRecap,
  });

  const reports = reportsResp || [];
  const issues = issuesResp || [];
  const books = booksResp || [];
  const monthlyComparison = monthlyComparisonResp || {};

  const bookTotals = useMemo(() => {
    const map = {};
    books.forEach((b) => {
      if (b?._id) map[String(b._id)] = Number(b.totalPages) || 0;
    });
    return map;
  }, [books]);

  const aggregates = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const monthly = reports.filter((r) => {
      const d = new Date(r.readingDate);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const monthlyIssues = issues.filter((it) => {
      const tsSource = it.issueDate || it.createdAt || it.updatedAt;
      if (!tsSource) return false;
      const d = new Date(tsSource);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    let totalPages = 0;
    let totalTime = 0; // minutes
    const pagesByDay = {};
    const ratingSum = { sum: 0, count: 0 };
    const pagesByBook = {};
    const daysSet = new Set();

    monthly.forEach((r) => {
      const pf = Number(r.pagesFrom) || 0;
      const pt = Number(r.pagesTo) || 0;
      const pages = pt - pf + 1;
      if (Number.isFinite(pages) && pages > 0) totalPages += pages;
      const t = Number(r.timeSpent) || 0;
      totalTime += t;

      const d = new Date(r.readingDate);
      const day = d.getDate();
      pagesByDay[day] = (pagesByDay[day] || 0) + (pages > 0 ? pages : 0);

      if (r.rating) {
        ratingSum.sum += Number(r.rating) || 0;
        ratingSum.count += 1;
      }

      const bookId = r.book ? String(r.book._id || r.book) : null;
      if (bookId) {
        const totalPages = Number(r.book?.totalPages) || bookTotals[bookId] || 0;
        pagesByBook[bookId] = pagesByBook[bookId] || { pages: 0, total: totalPages };
        pagesByBook[bookId].pages += pages > 0 ? pages : 0;
        if (totalPages > 0) pagesByBook[bookId].total = totalPages;
      }

      const dtOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime();
      daysSet.add(dtOnly);
    });

    const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
    const dailyData = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1, pages: pagesByDay[i + 1] || 0 }));

    const daysArr = Array.from(daysSet).sort((a, b) => a - b);
    let longestStreak = 0;
    let curStreak = 0;
    let prev = null;
    daysArr.forEach((ts) => {
      if (prev === null) curStreak = 1;
      else {
        const diffDays = (ts - prev) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) curStreak += 1;
        else curStreak = 1;
      }
      prev = ts;
      longestStreak = Math.max(longestStreak, curStreak);
    });

    const weekdayPages = {};
    monthly.forEach((r) => {
      const d = new Date(r.readingDate);
      const wd = d.toLocaleDateString(undefined, { weekday: 'short' });
      const pf = Number(r.pagesFrom) || 0;
      const pt = Number(r.pagesTo) || 0;
      const pages = pt - pf + 1;
      weekdayPages[wd] = (weekdayPages[wd] || 0) + (pages > 0 ? pages : 0);
    });
    let mostActiveDay = 'N/A';
    if (Object.keys(weekdayPages).length > 0) {
      mostActiveDay = Object.entries(weekdayPages).sort((a, b) => b[1] - a[1])[0][0];
    }

    const averageRating = ratingSum.count ? +(ratingSum.sum / ratingSum.count).toFixed(1) : 0;

    const issueBooks = new Set();
    monthlyIssues.forEach((it) => {
      const bid = it.book ? String(it.book._id || it.book) : null;
      if (bid) issueBooks.add(bid);
    });

    const booksStarted = issueBooks.size;
    let booksCompleted = 0;
    Object.values(pagesByBook).forEach((b) => {
      if (b.total > 0 && b.pages >= b.total) booksCompleted += 1;
    });

    // Achievements
    const achievements = [];
    // Consistent Reader: 5+ day streak
    if (longestStreak >= 5) achievements.push('Consistent Reader');

    // Weekend Warrior: weekends beat weekdays in pages or most active day is weekend
    const weekendPagesTotal = (weekdayPages['Sat'] || 0) + (weekdayPages['Sun'] || 0);
    const weekdayPagesTotal = (weekdayPages['Mon'] || 0) + (weekdayPages['Tue'] || 0) + (weekdayPages['Wed'] || 0) + (weekdayPages['Thu'] || 0) + (weekdayPages['Fri'] || 0);
    const mostIsWeekend = ['Sat', 'Sun'].includes(mostActiveDay);
    if (weekendPagesTotal > weekdayPagesTotal || mostIsWeekend) achievements.push('Weekend Warrior');

    // Speed Reader: average pages per reading day >= 40
    const avgPagesPerReadingDay = daysSet.size ? totalPages / daysSet.size : 0;
    if (avgPagesPerReadingDay >= 40) achievements.push('Speed Reader');

    // Prolific Reader: 300+ pages in the month
    if (totalPages >= 300) achievements.push('Prolific Reader');

    // Book Finisher badges
    if (booksCompleted >= 1) achievements.push('Book Finisher');
    if (booksCompleted >= 3) achievements.push('Series Slayer');

    // High Rating: average rating >= 4.5
    if (averageRating >= 4.5) achievements.push("Critic's Choice");

    // Calculate comparison percentage from monthly comparison API data
    const comparisonPagesChange = monthlyComparison?.changes?.pagesChange || 0;

    return {
      month: monthName,
      year,
      totalPages,
      totalTime,
      longestStreak,
      booksCompleted,
      booksStarted,
      mostActiveDay,
      averageRating,
      dailyData,
      achievements,
      comparisonLastMonth: comparisonPagesChange,
      monthlyStats: monthlyComparison?.currentMonth || {},
      prevMonthStats: monthlyComparison?.previousMonth || {},
    };
  }, [reports, issues, bookTotals, monthName, year, monthlyComparison]);

  const data = aggregates;

  const totalSlides = 10;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const freezeAnimations = (root) => {
    const nodes = [root, ...root.querySelectorAll('*')];
    const snapshots = nodes.map((n) => ({ node: n, animation: n.style.animation, transition: n.style.transition }));
    nodes.forEach((n) => {
      n.style.animation = 'none';
      n.style.transition = 'none';
    });
    return () => {
      snapshots.forEach(({ node, animation, transition }) => {
        node.style.animation = animation;
        node.style.transition = transition;
      });
    };
  };

  const adjustForCapture = (el) => {
    const prev = {
      width: el.style.width,
      height: el.style.height,
      overflow: el.style.overflow,
    };
    const rect = el.getBoundingClientRect();
    el.style.width = `${Math.ceil(rect.width)}px`;
    el.style.height = `${Math.ceil(rect.height)}px`;
    el.style.overflow = 'visible';
    return () => {
      el.style.width = prev.width;
      el.style.height = prev.height;
      el.style.overflow = prev.overflow;
    };
  };

  const applyNoAnim = (slideRoot) => {
    const styleId = 'recap-no-anim-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .slide-capture.no-anim * {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    slideRoot.classList.add('no-anim');
    return () => {
      slideRoot.classList.remove('no-anim');
    };
  };

  const downloadRecapImages = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const original = currentSlide;
      for (let i = 0; i < totalSlides; i++) {
        setCurrentSlide(i);
        // allow render + animations to settle
        await wait(900);
        const slideRoot = document.querySelector('.slide-capture');
        const target = document.querySelector('.slide-capture .recap-card');
        if (!target) continue;
        const removeNoAnim = slideRoot ? applyNoAnim(slideRoot) : () => {};
        await wait(100);
        const restore = freezeAnimations(target);
        const restoreSizing = adjustForCapture(target);
        const dataUrl = await toPng(target, {
          cacheBust: true,
          pixelRatio: 2,
        });
        restore();
        restoreSizing();
        removeNoAnim();
        const link = document.createElement('a');
        link.download = `${monthName}-${year}-recap-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        // small gap between downloads
        await wait(200);
      }
      // restore original slide
      setCurrentSlide(original);
    } catch (e) {
      console.error('Download recap failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, y: 50 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  const slideMotionProps = downloading
    ? { initial: false, animate: false, exit: false, transition: { duration: 0 } }
    : { initial: 'enter', animate: 'center', exit: 'exit', transition: { duration: 0.5 } };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (!canViewRecap) {
    const upcomingLastDayDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
    const nextMonthFirst = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1);
    const nextMonthFifth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 5);
    return (
      <div className={ "min-h-screen  flex items-center justify-center "}>
        <div className="max-w-2xl w-full">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-600 border-0 shadow-2xl recap-card">
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Recap not available yet</h2>
              <p className="text-slate-200 mb-6">
                Members can view recaps on the last day of the month and between the 1st–5th.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Badge className="bg-yellow-100 text-yellow-800">Last day: {upcomingLastDayDate.toLocaleDateString()}</Badge>
                <Badge className="bg-blue-100 text-blue-800">Next month window: {nextMonthFirst.toLocaleDateString()} – {nextMonthFifth.toLocaleDateString()}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={ "min-h-screen  flex items-center justify-center "}>
      <div className="max-w-4xl w-full">
        {/* Progress indicator */}
        <div className="mb-6 flex gap-1 justify-center">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-orange-600 w-12'
                  : index < currentSlide
                  ? 'bg-orange-400 w-8'
                  : 'bg-gray-300 w-8'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Slide 1: Intro */}
          {currentSlide === 0 && (
            <motion.div
              className="slide-capture"
              key="slide-0"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-gradient-to-br from-orange-600 to-indigo-700 border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <BookOpen className="w-20 h-20 text-white mx-auto mb-6" />
                  </motion.div>
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    📚 {displayName}, here's your
                  </motion.h1>
                  <motion.h2
                    className="text-5xl md:text-6xl font-bold text-yellow-300 mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                  >
                    {data.month} {data.year} Reading Recap
                  </motion.h2>
                  <motion.p
                    className="text-orange-100 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    Let's see how your reading journey looked this month
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 2: Pages Read */}
          {currentSlide === 1 && (
            <motion.div
              className="slide-capture"
              key="slide-1"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl overflow-hidden recap-card">
                <CardContent className="p-12 text-center relative">
                  {/* Floating book icons */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-orange-200"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        variants={itemVariants}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      >
                        <BookOpen className="w-8 h-8" />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <BookOpen className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-2xl text-gray-600 mb-4">You read</h2>
                  <div className="text-8xl font-bold text-orange-600 mb-4">
                    <AnimatedCounter value={data.totalPages} instant={downloading} />
                  </div>
                  <p className="text-3xl font-semibold text-gray-800 mb-6">pages this month!</p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                  >
                    <Badge className="bg-orange-100 text-orange-700 text-lg px-4 py-2 hover:bg-orange-100">
                      {data.comparisonLastMonth > 0 ? '+' : ''}{data.comparisonLastMonth}% from last month
                    </Badge>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 3: Time Spent */}
          {currentSlide === 2 && (
            <motion.div
              className="slide-capture"
              key="slide-2"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ rotate: 0, scale: 0 }}
                    animate={{ rotate: 360, scale: 1 }}
                    transition={{ duration: 1, type: 'spring' }}
                  >
                    <Clock className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-2xl text-gray-600 mb-4">Time Spent Reading</h2>
                  
                  {/* Circular progress */}
                  <div className="relative w-64 h-64 mx-auto mb-6">
                    <svg className="w-64 h-64 transform -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="20"
                        fill="none"
                        className="text-gray-200"
                      />
                      <motion.circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="currentColor"
                        strokeWidth="20"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 110}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 110 * 0.3 }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                        className="text-orange-600"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-gray-900">
                        <AnimatedCounter value={Math.floor(data.totalTime / 60)} instant={downloading} />
                      </div>
                      <div className="text-2xl text-gray-600">hours</div>
                    </div>
                  </div>

                  <motion.p
                    className="text-xl text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    That's {data.comparisonLastMonth}% more than last month! 🎉
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 4: Reading Streak */}
          {currentSlide === 3 && (
            <motion.div
              className="slide-capture"
              key="slide-3"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <Flame className="w-20 h-20 text-yellow-300 mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-2xl text-orange-100 mb-4">Longest Reading Streak</h2>
                  <div className="text-8xl font-bold text-white mb-4">
                    <AnimatedCounter value={data.longestStreak} instant={downloading} />
                  </div>
                  <p className="text-3xl font-semibold text-orange-100 mb-8">days in a row!</p>
                  
                  {/* Streak timeline */}
                  <motion.div
                    className="flex justify-center gap-2 flex-wrap max-w-md mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {[...Array(data.longestStreak)].map((_, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="w-12 h-12 bg-yellow-300 rounded-lg flex items-center justify-center"
                      >
                        <Flame className="w-6 h-6 text-orange-600" />
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.p
                    className="text-orange-100 text-lg mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    Keep the fire burning! 🔥
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 5: Books Summary */}
          {currentSlide === 4 && (
            <motion.div
              className="slide-capture"
              key="slide-4"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl recap-card">
                <CardContent className="p-12">
                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Books Summary</h2>
                  
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-gradient-to-br from-orange-50 to-emerald-100 p-8 rounded-2xl"
                    >
                      <BookOpen className="w-12 h-12 text-orange-600 mb-4" />
                      <div className="text-5xl font-bold text-orange-600 mb-2">
                        <AnimatedCounter value={data.booksCompleted} instant={downloading} />
                      </div>
                      <p className="text-xl text-orange-800 font-semibold">Books Completed 🎉</p>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl"
                    >
                      <BookOpen className="w-12 h-12 text-orange-600 mb-4" />
                      <div className="text-5xl font-bold text-orange-600 mb-2">
                        <AnimatedCounter value={data.booksStarted} instant={downloading} />
                      </div>
                      <p className="text-xl text-orange-800 font-semibold">Books Started</p>
                    </motion.div>
                  </motion.div>

                  <motion.p
                    className="text-center text-gray-600 mt-8 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    {data.booksStarted - data.booksCompleted} books still in progress
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 6: Most Active Day */}
          {currentSlide === 5 && (
            <motion.div
              className="slide-capture"
              key="slide-5"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-2xl text-gray-600 mb-4">Your Most Active Day</h2>
                  
                  <motion.div
                    className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-3xl p-12 mb-6"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    <div className="text-6xl font-bold mb-2">{data.mostActiveDay}</div>
                    <div className="text-2xl">was your reading power day!</div>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-7 gap-2 max-w-md mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <motion.div
                        key={day}
                        variants={itemVariants}
                        className={`p-3 rounded-lg text-sm font-medium ${
                          day === data.mostActiveDay.slice(0, 3)
                            ? 'bg-purple-600 text-white scale-110'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day}
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 7: Reading Mood */}
          {currentSlide === 6 && (
            <motion.div
              className="slide-capture"
              key="slide-6"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <Star className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-8">Reading Experience</h2>
                  
                  <motion.div
                    className="flex justify-center gap-2 mb-6"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        animate={
                          i < Math.floor(data.averageRating)
                            ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 360],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.5,
                          delay: i * 0.1,
                        }}
                      >
                        <Star
                          className={`w-16 h-16 ${
                            i < Math.floor(data.averageRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.p
                    className="text-2xl text-gray-700 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    Average rating: <span className="font-bold text-yellow-600">{data.averageRating}/5</span>
                  </motion.p>

                  <motion.p
                    className="text-lg text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    You felt ⭐⭐⭐⭐ focused most days
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 8: Achievements */}
          {currentSlide === 7 && (
            <motion.div
              className="slide-capture"
              key="slide-7"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 border-0 shadow-2xl overflow-hidden recap-card">
                <CardContent className="p-12 text-center relative">
                  {/* Confetti effect */}
                  <motion.div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: '-10%',
                          backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][
                            Math.floor(Math.random() * 5)
                          ],
                        }}
                        animate={{
                          y: ['0vh', '110vh'],
                          x: [0, Math.random() * 100 - 50],
                          rotate: [0, 360],
                          opacity: [1, 0],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Award className="w-20 h-20 text-white mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-8">Achievements Unlocked!</h2>
                  
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {(data.achievements || []).map((achievement, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Award className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                        <p className="text-lg font-bold text-gray-800"> {achievement}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 9: Progress Graph */}
          {currentSlide === 8 && (
            <motion.div
              className="slide-capture"
              key="slide-8"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-white border-0 shadow-2xl recap-card">
                <CardContent className="p-12">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <h2 className="text-3xl font-bold text-gray-800">Your Reading Journey</h2>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-96"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="day" 
                          label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
                          stroke="#6b7280"
                        />
                        <YAxis 
                          label={{ value: 'Pages', angle: -90, position: 'insideLeft' }}
                          stroke="#6b7280"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pages" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.p
                    className="text-center text-gray-600 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    Daily progress throughout the month
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Slide 10: Closing Screen */}
          {currentSlide === 9 && (
            <motion.div
              className="slide-capture"
              key="slide-9"
              variants={slideVariants}
              {...slideMotionProps}
            >
              <Card className="bg-gradient-to-br from-orange-600 to-teal-700 border-0 shadow-2xl recap-card">
                <CardContent className="p-12 text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <div className="text-8xl mb-6">💪</div>
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-6">Keep Going!</h2>
                  <p className="text-2xl text-orange-100 mb-8">
                    February can be even better
                  </p>

                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    <motion.div variants={itemVariants}>
                      <Button 
                        size="lg" 
                        className="bg-white text-orange-700 hover:bg-orange-50 w-full md:w-auto px-8"
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        View Detailed Stats
                      </Button>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-transparent border-2 border-white text-white hover:bg-white/10 w-full md:w-auto px-8"
                        onClick={downloadRecapImages}
                        disabled={downloading}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {downloading ? 'Downloading…' : 'Download Recap'}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <motion.p
                    className="text-orange-100 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    Share your achievements with friends (coming soon!)
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={previousSlide}
            disabled={currentSlide === 0}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm"
          >
            Previous
          </Button>
          
          <div className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full">
            {currentSlide + 1} / {totalSlides}
          </div>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}