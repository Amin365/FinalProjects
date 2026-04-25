import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const fmtDay = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "2-digit" });

const buildBuckets = (days) => {
  const end = startOfDay(new Date());
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(end.getTime() - i * DAY);
    const key = day.toISOString().slice(0, 10);
    buckets.push({ key, label: fmtDay(day), members: 0, books: 0, issues: 0 });
  }
  return buckets;
};

const fillBuckets = (buckets, items, field) => {
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const it of items) {
    const t = it?.createdAt ? new Date(it.createdAt) : null;
    if (!t) continue;
    const key = startOfDay(t).toISOString().slice(0, 10);
    const b = map.get(key);
    if (b) b[field] += 1;
  }
  return buckets;
};

export default function ChartsDashboard() {
  const [rangeDays, setRangeDays] = useState(7);

  const { data: members = [] } = useQuery({
    queryKey: ["members", "charts"],
    queryFn: () => api.get("/members"),
    select: (r) => r.data?.data ?? [],
    staleTime: 30_000,
  });

  const { data: books = [] } = useQuery({
    queryKey: ["books", "charts"],
    queryFn: () => api.get("/books"),
    select: (r) => r.data?.data ?? [],
    staleTime: 30_000,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues", "charts"],
    queryFn: () => api.get("/issues"),
    select: (r) => r.data?.data ?? [],
    staleTime: 30_000,
  });

  const buckets = useMemo(() => {
    let b = buildBuckets(rangeDays);
    b = fillBuckets(b, members, "members");
    b = fillBuckets(b, books, "books");
    b = fillBuckets(b, issues, "issues");
    return b;
  }, [rangeDays, members, books, issues]);

  const chartData = useMemo(() => {
    return {
      labels: buckets.map((b) => b.label),
      datasets: [
        {
          label: "Members",
          data: buckets.map((b) => b.members),
          backgroundColor: "rgba(37, 99, 235, 0.7)", // blue
        },
        {
          label: "Books",
          data: buckets.map((b) => b.books),
          backgroundColor: "rgba(22, 163, 74, 0.7)", // green
        },
        {
          label: "Issued",
          data: buckets.map((b) => b.issues),
          backgroundColor: "rgba(245, 158, 11, 0.75)", // amber
        },
      ],
    };
  }, [buckets]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: `Activity (last ${rangeDays} days)` },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { stacked: false, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }),
    [rangeDays]
  );

  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Charts</CardTitle>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={rangeDays === 7 ? "default" : "outline"}
            onClick={() => setRangeDays(7)}
          >
            7 days
          </Button>
          <Button
            size="sm"
            variant={rangeDays === 30 ? "default" : "outline"}
            onClick={() => setRangeDays(30)}
          >
            30 days
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[320px]">
          <Bar data={chartData} options={options} />
        </div>
        {/* <div className="mt-2 text-xs text-muted-foreground">
          Counts are based on <code>createdAt</code> returned from your APIs.
        </div> */}
      </CardContent>
    </Card>
  );
}