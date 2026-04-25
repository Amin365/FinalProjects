import { useQuery } from '@tanstack/react-query';
import api from '@/app/api/apislice';
import { Flame, Trophy, BookOpen, Clock, FileText, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import HeroHeader from '../Homepage/HeroSections';
import Footers from '../Homepage/Footer';
import Loader from "../Loader";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PERIODS = [
  { label: 'All Time', value: 'all-time' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Week', value: 'weekly' },
];

const SORT_FIELDS = [
  { label: 'Streak', value: 'streak' },
  { label: 'Pages', value: 'pages' },
  { label: 'Minutes', value: 'minutes' },
  { label: 'Reports', value: 'reports' },
];

const getUserName = (user) => {
  if (!user) return "User";
  if (typeof user === "string") return user;
  return (
    [user.first_name, user.middle_name, user.last_name]
      .filter(Boolean)
      .join(" ") ||
    user.username ||
    user.email ||
    "User"
  );
};

function calcLongestStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...dates]
    .map(d => new Date(new Date(d).toDateString()).getTime())
    .sort((a, b) => a - b);

  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 86400000) cur++;
    else if (sorted[i] !== sorted[i - 1]) cur = 1;
    max = Math.max(max, cur);
  }
  return max;
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-yellow-400" />
    : <ChevronDown className="w-3 h-3 text-yellow-400" />;
}

const SORT_FIELD_MAP = {
  streak: 'streak',
  pages: 'pagesRead',
  minutes: 'minutesRead',
  reports: 'reportsCount',
};

export default function Leaderboard() {
  const location = useLocation();
  const hideHero = location.pathname === '/dashboard/leaderboard' || location.pathname === '/dashboard/Leaderboard';

  const [period, setPeriod] = useState('all-time');
  const [department, setDepartment] = useState('');
  const [sortField, setSortField] = useState('streak');
  const [sortDir, setSortDir] = useState('desc');

  const useEnhanced = period !== 'all-time' || department.trim() !== '';

  // Legacy "all-time" fetch from daily-reports/public
  const { data: reports = [], isLoading: legacyLoading } = useQuery({
    queryKey: ['dailyReports', 'public'],
    queryFn: async () => {
      const res = await api.get('/daily-reports/public', { params: { limit: 10000 } });
      return res.data?.data || [];
    },
    enabled: !useEnhanced,
  });

  // Enhanced leaderboard endpoint
  const { data: enhancedData = [], isLoading: enhancedLoading } = useQuery({
    queryKey: ['leaderboard', 'enhanced', period, department, sortField],
    queryFn: async () => {
      const params = { period, sortBy: sortField };
      if (department.trim()) params.department = department.trim();
      const res = await api.get('/daily-reports/leaderboard', { params });
      return res.data?.data || res.data || [];
    },
    enabled: useEnhanced,
  });

  const isLoading = useEnhanced ? enhancedLoading : legacyLoading;

  // Build unified leaderboard array
  const leaderboard = useMemo(() => {
    if (useEnhanced) {
      return [...enhancedData]
        .map(entry => ({
          user: entry.user,
          streak: entry.streak ?? 0,
          pagesRead: entry.pagesRead ?? 0,
          minutesRead: entry.minutesRead ?? 0,
          reportsCount: entry.reportsCount ?? 0,
        }))
        .sort((a, b) => {
          const key = SORT_FIELD_MAP[sortField] || 'streak';
          return sortDir === 'desc' ? b[key] - a[key] : a[key] - b[key];
        });
    }

    const map = {};
    reports.forEach(r => {
      const id = r.createdBy?._id || r.createdBy;
      if (!id) return;
      if (!map[id]) map[id] = { user: r.createdBy, dates: [], pagesRead: 0, minutesRead: 0, reportsCount: 0 };
      map[id].dates.push(r.readingDate);
      map[id].pagesRead += r.pagesRead || 0;
      map[id].minutesRead += r.minutesRead || 0;
      map[id].reportsCount += 1;
    });

    return Object.values(map)
      .map(u => ({
        user: u.user,
        streak: calcLongestStreak(u.dates),
        pagesRead: u.pagesRead,
        minutesRead: u.minutesRead,
        reportsCount: u.reportsCount,
      }))
      .sort((a, b) => {
        const key = SORT_FIELD_MAP[sortField] || 'streak';
        return sortDir === 'desc' ? b[key] - a[key] : a[key] - b[key];
      })
      .slice(0, 1000);
  }, [useEnhanced, enhancedData, reports, sortField, sortDir]);

  function handleColumnSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const top3 = leaderboard.slice(0, 3);

  if (isLoading) {
    return <Loader size="lg" colorClass="text-white" />;
  }



  return (
    <main className="min-h-screen py-10 px-2 md:px-6">
      {!hideHero && (
        <div className="mb-32">
          <HeroHeader />
        </div>
      )}

      {/* Header */}
      <div className="text-center mt-20 mb-10 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🏆 Leaderboard 🏆
        </h1>
        <p className="text-gray-400 mt-3">
          Celebrating our most dedicated Readers! 🎉
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="w-full max-w-7xl mx-auto mb-8 space-y-4">
        {/* Period tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'outline'}
              onClick={() => setPeriod(p.value)}
              className="rounded-full"
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Sort + Department row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-400"></div>
          {/* {SORT_FIELDS.map((sf) => (
            <Button
              key={sf.value}
              size="sm"
              variant={sortField === sf.value ? 'secondary' : 'ghost'}
              onClick={() => handleColumnSort(sf.value)}
              className="gap-1 h-7 text-xs"
            >
              {sf.label}
              <SortIcon field={sf.value} sortField={sortField} sortDir={sortDir} />
            </Button>
          ))} */}

          <div className="ml-auto">
            {/* <Input
              placeholder="Filter by department..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-8 w-48 text-sm bg-zinc-800 border-zinc-700"
            /> */}
          </div>
        </div>
      </div>

      {/* Podium */}
      <div className="flex mt-12 flex-col sm:flex-row justify-center items-end gap-6 mb-12 md:mb-20">
        {top3[1] && (
          <PodiumCard
            rank="2nd Place"
            color="from-slate-700 to-slate-900"
            accent="border-slate-400"
            user={top3[1]}
            className="order-1 sm:order-none"
          />
        )}
        {top3[0] && (
          <PodiumCard
            rank="1st Place"
            color="from-yellow-700 to-amber-900"
            accent="border-yellow-400"
            crown
            user={top3[0]}
            scale
            className="order-0 sm:mb-2"
          />
        )}
        {top3[2] && (
          <PodiumCard
            rank="3rd Place"
            color="from-orange-700 to-rose-900"
            accent="border-orange-400"
            user={top3[2]}
            className="order-2 sm:order-none"
          />
        )}
      </div>

      {/* Table */}
      <section className="w-full max-w-7xl mx-auto dark:bg-zinc-900 rounded-2xl p-4 md:p-6 shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold">Top Readers</h2>
        <p className="text-sm text-gray-400 mb-6">
          Keep reading to climb the ranks!
        </p>

        {/* Column header row */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 text-xs text-gray-400 uppercase tracking-wide border-b border-zinc-700 mb-2">
          <div className="flex items-center gap-4 w-[40%]">
            <span className="w-8">Rank</span>
            <span className="w-10" />
            <span>Name</span>
          </div>
          <div className="flex items-center gap-8">
            <button
              className="flex items-center gap-1 hover:text-yellow-400 transition"
              onClick={() => handleColumnSort('streak')}
            >
              <Flame className="w-3 h-3" /> Streak
              <SortIcon field="streak" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className="flex items-center gap-1 hover:text-blue-400 transition"
              onClick={() => handleColumnSort('pages')}
            >
              <BookOpen className="w-3 h-3" /> Pages
              <SortIcon field="pages" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className="flex items-center gap-1 hover:text-purple-400 transition"
              onClick={() => handleColumnSort('minutes')}
            >
              <Clock className="w-3 h-3" /> Minutes
              <SortIcon field="minutes" sortField={sortField} sortDir={sortDir} />
            </button>
            <button
              className="flex items-center gap-1 hover:text-orange-400 transition"
              onClick={() => handleColumnSort('reports')}
            >
              <FileText className="w-3 h-3" /> Reports
              <SortIcon field="reports" sortField={sortField} sortDir={sortDir} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((u, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-4 py-4 hover:bg-gray-500/20 transition"
            >
              {/* LEFT */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-8 h-8 rounded-md text-black dark:text-white dark:bg-black border border-zinc-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold shrink-0">
                  {getUserName(u.user).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold dark:text-white text-black truncate">
                    {getUserName(u.user)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Streak: {u.streak} days
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-4 md:gap-8 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 justify-end">
                    <Flame className="w-4 h-4" />
                    <span className="font-bold">{u.streak}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right hidden md:block">Streak</p>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 text-blue-400 justify-end">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-bold">{u.pagesRead ?? 0}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right hidden md:block">Pages</p>
                </div>

                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-1 text-purple-400 justify-end">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{u.minutesRead ?? 0}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Minutes</p>
                </div>

                <div className="text-right hidden md:block">
                  <div className="flex items-center gap-1 text-orange-400 justify-end">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold">{u.reportsCount ?? 0}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Reports</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No readers found.
          </div>
        )}
      </section>

      <div className="mt-32">
        <Footers clubLogoSrc="/jjuclub.jpg" />
      </div>
    </main>
  );
}

function PodiumCard({ rank, color, accent, user, crown, scale, className = "" }) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`
        relative w-full text-white max-w-xs rounded-3xl p-5 md:p-6 bg-gradient-to-b ${color}
        border-2 ${accent} text-center
        ${scale ? "scale-110 z-20" : "z-10"}
        ${className}
      `}
    >
      {crown && (
        <Trophy className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400" />
      )}

      <span className="inline-block mb-4 px-4 py-1 rounded-full bg-black/40 text-sm">
        {rank}
      </span>

      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-black/30 flex items-center justify-center text-3xl font-bold mb-4">
        {getUserName(user.user).slice(0, 2)}
      </div>

      <h3 className="font-bold text-md md:text-lg mb-2 truncate">
        {getUserName(user.user)}
      </h3>

      <div className="flex justify-center items-center gap-2 text-yellow-400 mb-2">
        <Flame className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-xl font-bold">{user.streak}</span>
        <span className="text-sm text-gray-300 hidden md:inline">streak</span>
      </div>
      <div className="flex justify-center gap-4 text-xs text-gray-300 mt-1">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-blue-300" /> {user.pagesRead ?? 0}p
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-orange-300" /> {user.reportsCount ?? 0}r
        </span>
      </div>
    </motion.div>
  );
}