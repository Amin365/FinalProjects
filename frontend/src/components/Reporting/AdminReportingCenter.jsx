import React, { useMemo, useRef, useState } from "react";
import {
  Filter,
  BookOpen,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Users,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  TextRun,
  WidthType,
} from "docx";

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "text-orange-600" }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{trendValue}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportingCenter() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef(null);

  const { data: kpisResp, isLoading: kpisLoading } = useQuery({
    queryKey: ["reporting", "kpis", filters.from, filters.to],
    queryFn: async () => {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await api.get("/reporting/kpis", { params });
      return res.data?.data || null;
    },
    staleTime: 60_000,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ from: "", to: "" });
  };

  const topPrograms = useMemo(() => kpisResp?.topPrograms || [], [kpisResp]);
  const topProgram = kpisResp?.topProgram || null;
  const isLoading = kpisLoading;

  const reportTitle = "Library & Programs Report";
  const reportGeneratedAt = useMemo(() => new Date(), []);
  const reportDateRangeLabel = useMemo(() => {
    if (filters.from || filters.to) {
      const from = filters.from || "(start)";
      const to = filters.to || "(end)";
      return `${from} → ${to}`;
    }
    return "Current month";
  }, [filters.from, filters.to]);

  const reportFilenameBase = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    return `report-${stamp}`;
  }, []);

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const props = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (props.height * imgWidth) / props.width;
      const y = 0;

      pdf.addImage(dataUrl, "PNG", 0, y, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`${reportFilenameBase}.pdf`);
    } catch (error) {
      console.error("PDF download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadDocx = async () => {
    try {
      setIsDownloading(true);

      const k = kpisResp || {};
      const kpiRows = [
        ["Books issued", String(k.issuedBooks ?? 0)],
        ["Programs", String(k.programs ?? 0)],
        ["Enrollments", String(k.enrollments ?? 0)],
        ["Volunteer requests", String(k.volunteerRequests ?? 0)],
        ["Top program", topProgram?.title ? `${topProgram.title} (${topProgram.enrollments})` : "N/A"],
      ];

      const kpiTable = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: kpiRows.map(
          ([label, value]) =>
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: label, bold: true })],
                    }),
                  ],
                }),
                new DocxTableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: [new Paragraph(String(value))],
                }),
              ],
            })
        ),
      });

      const topProgramsTable = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Program", bold: true })] })],
              }),
              new DocxTableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Enrollments", bold: true })] })],
              }),
            ],
          }),
          ...topPrograms.slice(0, 10).map(
            (p) =>
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph(p.title || p.programId || "-")],
                  }),
                  new DocxTableCell({
                    children: [new Paragraph(String(p.enrollments ?? 0))],
                  }),
                ],
              })
          ),
        ],
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 },
              },
            },
            children: [
              new Paragraph({
                text: reportTitle,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Date range: ${reportDateRangeLabel}`, bold: true }),
                ],
              }),
              new Paragraph({
                text: `Generated: ${reportGeneratedAt.toLocaleString()}`,
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "KPIs", heading: HeadingLevel.HEADING_1 }),
              kpiTable,
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Top Programs", heading: HeadingLevel.HEADING_1 }),
              topProgramsTable,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportFilenameBase}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-orange-600" />
            Admin Reporting Center
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monthly and range-based KPIs
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadPdf}
            disabled={isDownloading || isLoading || !kpisResp}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={downloadDocx}
            disabled={isDownloading || isLoading || !kpisResp}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Download DOCX
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {kpisResp && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Books Issued"
            value={kpisResp.issuedBooks ?? 0}
            subtitle="This month (default) or selected range"
            icon={BookOpen}
          />
          <StatCard
            title="Programs"
            value={kpisResp.programs ?? 0}
            subtitle="Programs starting in range"
            icon={BarChart3}
          />
          <StatCard
            title="Enrollments"
            value={kpisResp.enrollments ?? 0}
            subtitle="Students enrolled in range"
            icon={Users}
          />
          <StatCard
            title="Volunteer Requests"
            value={kpisResp.volunteerRequests ?? 0}
            subtitle="Registered to become teacher"
            icon={Filter}
          />
          <StatCard
            title="Top Program"
            value={topProgram?.title || "N/A"}
            subtitle={topProgram ? `${topProgram.enrollments} enrollments` : "No enrollments"}
            icon={ArrowUpRight}
          />
        </div>
      )}

      {/* Top Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Top Programs by Enrollment
            </CardTitle>
            <CardDescription>Most enrolled programs in the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              </div>
            ) : topPrograms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Enrollments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPrograms.map((p, idx) => (
                    <TableRow key={p.programId || idx}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{p.title || p.programId}</TableCell>
                      <TableCell className="text-right">{p.enrollments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No enrollment data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5" />
              Enrollment Chart
            </CardTitle>
            <CardDescription>Visual ranking of program enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPrograms} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="title" width={140} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrollments" fill="#f97316" name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden A4 paper for downloads */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={reportRef}
          style={{ width: "794px", minHeight: "1123px" }}
          className="bg-white text-slate-900 p-10"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{reportTitle}</h2>
              <p className="text-sm text-slate-600 mt-1">Date range: {reportDateRangeLabel}</p>
              <p className="text-sm text-slate-600">Generated: {reportGeneratedAt.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Summary</p>
              <p className="text-xs text-slate-600">KPIs + Top programs</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold">KPIs</h3>
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-medium">Books issued</td>
                    <td className="p-3 text-right">{kpisResp?.issuedBooks ?? 0}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-medium">Programs</td>
                    <td className="p-3 text-right">{kpisResp?.programs ?? 0}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-medium">Enrollments</td>
                    <td className="p-3 text-right">{kpisResp?.enrollments ?? 0}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 font-medium">Volunteer requests</td>
                    <td className="p-3 text-right">{kpisResp?.volunteerRequests ?? 0}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Top program</td>
                    <td className="p-3 text-right">
                      {topProgram?.title ? `${topProgram.title} (${topProgram.enrollments})` : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold">Top Programs by Enrollment</h3>
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 text-left font-semibold">Program</th>
                    <th className="p-3 text-right font-semibold">Enrollments</th>
                  </tr>
                </thead>
                <tbody>
                  {(topPrograms || []).slice(0, 10).map((p) => (
                    <tr key={p.programId} className="border-b border-slate-200 last:border-b-0">
                      <td className="p-3">{p.title || p.programId}</td>
                      <td className="p-3 text-right">{p.enrollments ?? 0}</td>
                    </tr>
                  ))}
                  {(!topPrograms || topPrograms.length === 0) && (
                    <tr>
                      <td className="p-3 text-slate-600" colSpan={2}>
                        No enrollment data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500">Generated by the Admin Reporting Center</p>
          </div>
        </div>
      </div>
    </div>
  );
}
