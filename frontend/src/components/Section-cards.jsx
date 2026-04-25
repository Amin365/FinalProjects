import React, { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "../app/api/apislice";
import ChartsDashboard from "../pages/ChartsDashboard";
import RecentActions from "../pages/RecentActions";

const DAY = 24 * 60 * 60 * 1000;

const toMs = (d) => (d ? new Date(d).getTime() : 0);

const pctChange = (current, previous) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100; // from 0 to something
  return ((current - previous) / previous) * 100;
};

const formatPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const countInRange = (items, fromMs, toMsExclusive) =>
  items.filter((x) => {
    const t = toMs(x.createdAt);
    return t >= fromMs && t < toMsExclusive;
  }).length;

export function SectionCards() {
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get("/members"),
    select: (response) => response.data?.data ?? [],
  });

  const { data: booksData = { items: [], total: 0 } } = useQuery({
    queryKey: ["books"],
    queryFn: () => api.get("/books?limit=10000"),
    select: (response) => ({
      items: response.data?.data ?? [],
      total: response.data?.total ?? 0,
    }),
  });

  const books = booksData.items;
  const booksTotal = booksData.total;

  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => api.get("/issue"),
    select: (response) => response.data?.data ?? [],
  });

  const stats = useMemo(() => {
    const now = Date.now();
    const currentFrom = now - 30 * DAY;
    const prevFrom = now - 60 * DAY;

    const membersCurrent = countInRange(members, currentFrom, now);
    const membersPrev = countInRange(members, prevFrom, currentFrom);
    const membersPct = pctChange(membersCurrent, membersPrev);

    const booksCurrent = countInRange(books, currentFrom, now);
    const booksPrev = countInRange(books, prevFrom, currentFrom);
    const booksPct = pctChange(booksCurrent, booksPrev);

    const issuesCurrent = countInRange(issues, currentFrom, now);
    const issuesPrev = countInRange(issues, prevFrom, currentFrom);
    const issuesPct = pctChange(issuesCurrent, issuesPrev);

    // Example "Growth Rate": average of the 3 pcts
    const growthRate = (membersPct + booksPct + issuesPct) / 3;

    return {
      members: { total: members.length, pct: membersPct, current: membersCurrent, prev: membersPrev },
      books: { total: booksTotal || books.length, pct: booksPct, current: booksCurrent, prev: booksPrev },
      issues: { total: issues.length, pct: issuesPct, current: issuesCurrent, prev: issuesPrev },
      growthRate,
    };
  }, [members, books, issues]);

  const TrendBadge = ({ pct }) => {
    const up = pct >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <Badge variant="outline">
        <Icon className="mr-1" />
        {formatPct(pct)}
      </Badge>
    );
  };

  const TrendFooter = ({ pct, label }) => {
    const up = pct >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <div className="line-clamp-1 flex gap-2 font-medium">
        {label} <Icon className="size-4" />
      </div>
    );
  };

  return (

   <div className="mt-12">
     <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 lg:px-6 mb-8">
      {/* Members */}
      <Card className="@container/card" >
        <CardHeader>
          <CardDescription>Total Members</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.members.total || 0}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.members.pct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendFooter
            pct={stats.members.pct}
            label={stats.members.pct >= 0 ? "Trending up this month" : "Trending down this month"}
          />
          <div className="text-muted-foreground">
            Last 30d: {stats.members.current} • Prev 30d: {stats.members.prev}
          </div>
        </CardFooter>
      </Card>

      {/* Books */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Books</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.books.total || 0}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.books.pct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendFooter
            pct={stats.books.pct}
            label={stats.books.pct >= 0 ? "Up this period" : "Down this period"}
          />
          <div className="text-muted-foreground">
            Last 30d: {stats.books.current} • Prev 30d: {stats.books.prev}
          </div>
        </CardFooter>
      </Card>

      {/* Issues */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Issued Books</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.issues.total || 0}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.issues.pct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendFooter
            pct={stats.issues.pct}
            label={stats.issues.pct >= 0 ? "More activity this month" : "Less activity this month"}
          />
          <div className="text-muted-foreground">
            Last 30d: {stats.issues.current} • Prev 30d: {stats.issues.prev}
          </div>
        </CardFooter>
      </Card>

      {/* Growth Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatPct(stats.growthRate)}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.growthRate} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <TrendFooter
            pct={stats.growthRate}
            label={stats.growthRate >= 0 ? "Steady performance increase" : "Decline vs last period"}
          />
          <div className="text-muted-foreground">Avg of Members/Books/Issues change (30d vs prev 30d)</div>
        </CardFooter>
      </Card>
    </div>
    <div className="px-4 flex flex-col lg:px-6 mt-4 space-y-4">
  <ChartsDashboard />
  <RecentActions />
</div>
   </div>
  );
}