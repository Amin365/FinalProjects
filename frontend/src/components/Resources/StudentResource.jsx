import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Download, BookOpen, FileText, Film,
  FileSpreadsheet, Link2, Star, Eye,
  Clock, ChevronDown, X, Presentation,
  FileIcon, Lock, Globe, Users,
  Bookmark, BookMarked, Zap, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/app/api/apislice";
import FilePreview from "@/components/ExtraComponents/FilePreview";
import { toast } from "sonner";

const getPublicBaseUrl = () => {
  const base = String(api?.defaults?.baseURL || "");
  // baseURL is typically like http://localhost:5000/api
  return base.replace(/\/api\/?$/, "");
};

const normalizeFileUrl = (rawUrl) => {
  const url = String(rawUrl || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const publicBase = getPublicBaseUrl();
  const cleaned = url.replace(/\\/g, "/");
  if (!publicBase) return cleaned;

  if (cleaned.startsWith("/")) return `${publicBase}${cleaned}`;
  return `${publicBase}/${cleaned}`;
};

const guessMimeFromType = (resourceType, fileUrl) => {
  const t = String(resourceType || "").toLowerCase();
  const url = String(fileUrl || "");
  const ext = (url.split("?")[0].split("#")[0].split(".").pop() || "").toLowerCase();

  const fromExt = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };
  if (fromExt[ext]) return fromExt[ext];

  if (t === "video") return "video/mp4";
  if (t === "link") return "text/html";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(t)) {
    return fromExt[t] || "application/octet-stream";
  }
  return "application/octet-stream";
};

const toCardResource = (serverResource) => {
  const uploadedBy = serverResource?.uploadedBy;
  const authorName =
    uploadedBy && typeof uploadedBy === "object"
      ? [uploadedBy.first_name, uploadedBy.last_name].filter(Boolean).join(" ").trim() || uploadedBy.email
      : String(uploadedBy || "");

  const fileUrl = normalizeFileUrl(serverResource?.fileUrl || "");
  const type = String(serverResource?.type || "other").toLowerCase();

  return {
    id: String(serverResource?._id || ""),
    title: serverResource?.title || "",
    description: serverResource?.description || "",
    type,
    category: serverResource?.category || "Uncategorized",
    accessLevel: serverResource?.accessLevel || "public",
    fileUrl,
    fileSize: null,
    author: authorName || "—",
    uploadedAt: serverResource?.createdAt || serverResource?.updatedAt || new Date().toISOString(),
    downloads: Number(serverResource?.downloads || 0),
    views: Number(serverResource?.views || 0),
    rating: 0,
    featured: false,
    __previewFile: {
      filename: serverResource?.title || "resource",
      filepath: fileUrl,
      mimetype: guessMimeFromType(type, fileUrl),
    },
  };
};

const CATEGORIES = [
  { key: "All",              label: "All resources" },
  { key: "Technology",       label: "Technology" },
  { key: "Computer Science", label: "Computer Science" },
  { key: "Data Science",     label: "Data Science" },
  { key: "Design",           label: "Design" },
  { key: "Business",         label: "Business" },
];

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest" },
  { value: "popular",  label: "Most downloaded" },
  { value: "rating",   label: "Top rated" },
];

/* 
   TYPE META
 */
const TYPE_META = {
  pdf:   { icon: FileText,       label: "PDF",    bg: "bg-red-50 dark:bg-red-900/20",       color: "text-red-500",     iconBg: "bg-red-100 dark:bg-red-900/30"     },
  docx:  { icon: FileText,       label: "Word",   bg: "bg-blue-50 dark:bg-blue-900/20",     color: "text-blue-500",    iconBg: "bg-blue-100 dark:bg-blue-900/30"   },
  doc:   { icon: FileText,       label: "Word",   bg: "bg-blue-50 dark:bg-blue-900/20",     color: "text-blue-500",    iconBg: "bg-blue-100 dark:bg-blue-900/30"   },
  xlsx:  { icon: FileSpreadsheet,label: "Sheet",  bg: "bg-emerald-50 dark:bg-emerald-900/20",color:"text-emerald-500", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
  xls:   { icon: FileSpreadsheet,label: "Sheet",  bg: "bg-emerald-50 dark:bg-emerald-900/20",color:"text-emerald-500", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
  pptx:  { icon: Presentation,   label: "Slides", bg: "bg-orange-50 dark:bg-orange-900/20", color: "text-orange-500",  iconBg: "bg-orange-100 dark:bg-orange-900/30" },
  ppt:   { icon: Presentation,   label: "Slides", bg: "bg-orange-50 dark:bg-orange-900/20", color: "text-orange-500",  iconBg: "bg-orange-100 dark:bg-orange-900/30" },
  video: { icon: Film,           label: "Video",  bg: "bg-purple-50 dark:bg-purple-900/20", color: "text-purple-500",  iconBg: "bg-purple-100 dark:bg-purple-900/30" },
  link:  { icon: Link2,          label: "Link",   bg: "bg-slate-50 dark:bg-gray-800/60",    color: "text-slate-500",   iconBg: "bg-slate-100 dark:bg-gray-700"       },
  other: { icon: FileIcon,       label: "File",   bg: "bg-slate-50 dark:bg-gray-800/60",    color: "text-slate-500",   iconBg: "bg-slate-100 dark:bg-gray-700"       },
};

const ACCESS_META = {
  "public":       { icon: Globe,  label: "Public",   pill: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40" },
  "program-only": { icon: Users,  label: "Program",  pill: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/40"   },
  "private":      { icon: Lock,   label: "Private",  pill: "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"            },
};

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtNum  = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;
const getMeta = (r) => r.pages ? `${r.pages} pages` : r.slides ? `${r.slides} slides` : r.sheets ? `${r.sheets} sheets` : r.duration ?? r.fileSize ?? "—";

/*  Stars ─ */
const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11}
        className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700"} />
    ))}
    <span className="ml-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-200">{rating}</span>
  </div>
);

/* 
   RESOURCE CARD  — wide, 3-col grid
 */
const ResourceCard = ({ resource, saved, onSave, onPreview, onDownload }) => {
  const tm  = TYPE_META[resource.type] || TYPE_META.other;
  const am  = ACCESS_META[resource.accessLevel] || ACCESS_META.public;
  const Icon = tm.icon;
  const AIcon = am.icon;
  const isLink = resource.type === "link";

  return (
    <div className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">

      {/*  Coloured header ─ */}
      <div className={`relative ${tm.bg} px-6 pt-6 pb-5`}>
        {/* featured badge */}
        {resource.featured && (
          <span className="absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30">
            ★ Featured
          </span>
        )}

        <div className="flex items-start gap-4">
          {/* Big type icon */}
          <div className={`w-14 h-14 rounded-2xl ${tm.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={26} className={tm.color} />
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            {/* type + access row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tm.iconBg} ${tm.color}`}>
                {tm.label}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${am.pill}`}>
                <AIcon size={10} /> {am.label}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-gray-800/70 text-slate-500 dark:text-slate-400">
                {resource.category}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
              {resource.title}
            </h3>
          </div>
        </div>
      </div>

      {/*  Body  */}
      <div className="flex flex-col flex-1 px-6 py-4 gap-4">
        {/* Description */}
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {resource.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[12px] text-slate-400 dark:text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <BookOpen size={12} />
            {resource.author}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-700" />
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {fmtDate(resource.uploadedAt)}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-700" />
          <span className="font-semibold text-slate-500 dark:text-slate-300">
            {getMeta(resource)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <Stars rating={resource.rating} />
          <div className="flex items-center gap-3 ml-auto text-[12px] text-slate-400">
            <span className="flex items-center gap-1"><Eye size={12} />{fmtNum(resource.views)}</span>
            <span className="flex items-center gap-1"><Download size={12} />{fmtNum(resource.downloads)}</span>
          </div>
        </div>
      </div>

      {/*  Footer  */}
      <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-gray-800 mt-auto">
        <div className="flex items-center gap-5 mt-4">
          {/* Save */}
          <button
            onClick={() => onSave(resource.id)}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all
              ${saved
                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-500"
                : "bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-400 hover:border-orange-200 hover:text-orange-400"
              }`}
            title={saved ? "Saved" : "Save"}
          >
            {saved ? <BookMarked size={16} /> : <Bookmark size={16} />}
          </button>

          {/* Preview */}
          {isLink ? (
            <button
              onClick={onPreview}
              className="flex-1 w-full h-11 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 text-[13px] font-bold flex items-center justify-center gap-2 hover:border-orange-300 hover:text-orange-500 dark:hover:text-orange-400 transition-all"
            >
              <Eye size={15} />
              Open link
            </button>
          ) : (
            <FilePreview file={resource.__previewFile} selectedIndex={0} allFiles={[resource.__previewFile]}>
              <button
                onClick={onPreview}
                className="flex-1 h-11 w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 text-[13px] font-bold flex items-center justify-center gap-2 hover:border-orange-300 hover:text-orange-500 dark:hover:text-orange-400 transition-all"
              >
                <Eye size={15} />
                Preview
              </button>
            </FilePreview>
          )}

          {/* Download */}
          {!isLink && (
            <button
              onClick={onDownload}
              className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all"
            >
              <Download size={15} />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* 
   PAGE
 */
export default function StudentResources() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [sort,     setSort]     = useState("newest");
  const [savedIds, setSavedIds] = useState(new Set());

  const resourcesQuery = useQuery({
    queryKey: ["student-resources"],
    queryFn: async () => {
      const res = await api.get("/resources", { params: { page: 1, limit: 100 } });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!resourcesQuery.error) return;
    toast.error(resourcesQuery?.error?.response?.data?.message || "Failed to load resources");
  }, [resourcesQuery.error]);

  const resources = useMemo(() => (resourcesQuery.data || []).map(toCardResource), [resourcesQuery.data]);

  const incViews = useMutation({
    mutationFn: async (id) => {
      await api.post(`/resources/${id}/views`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-resources"] });
    },
  });

  const incDownloads = useMutation({
    mutationFn: async (id) => {
      await api.post(`/resources/${id}/downloads`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-resources"] });
    },
  });

  const toggleSave = (id) =>
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let list = [...resources];
    if (search.trim())
      list = list.filter(r =>
        [r.title, r.description, r.author, r.category].join(" ")
          .toLowerCase().includes(search.toLowerCase())
      );
    if (category !== "All")
      list = list.filter(r => r.category === category);

    if (sort === "newest")  list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    if (sort === "popular") list.sort((a, b) => b.downloads - a.downloads);
    if (sort === "rating")  list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [resources, search, category, sort]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-24">

      {/* 
          PAGE HERO HEADER
       */}
      <div className="relativeborder-b border-slate-100 dark:border-gray-800 overflow-hidden">
        {/* background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full " />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
            // style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "32px 32px" }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 text-[11px] font-extrabold uppercase tracking-widest mb-5">
                <Zap size={11} className="fill-orange-400" />
                Learning resources
              </div>
              <h1 className="text-[34px] md:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Resource{" "}
                <span className="relative">
                  <span className="text-orange-500">Library</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="5" viewBox="0 0 120 5" preserveAspectRatio="none">
                    <path d="M0 4 Q30 1 60 4 Q90 7 120 4" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </span>
              </h1>
              <p className="mt-3 text-[15px] text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                Browse, preview and download all your learning materials — videos, PDFs, slides and more.
              </p>
            </div>

            {/* Header stats */}
            <div className="flex gap-6 shrink-0">
              {[
                { icon: BookOpen,   value: resources.length,                            label: "Total files"   },
                { icon: Star,       value: resources.filter(r => r.featured).length,    label: "Featured"      },
                { icon: BookMarked, value: savedIds.size,                              label: "Saved by you"  },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center">
                    <Icon size={15} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/*  Search + Sort row  */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <div className="relative flex-1 max-w-lg">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-10 pr-10 h-12 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[13.5px] text-slate-800 dark:text-gray-100 placeholder:text-slate-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all shadow-sm"
                placeholder="Search resources, authors, topics…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="h-12 pl-4 pr-10 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[13px] font-semibold text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all shadow-sm cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/*  Category tabs  */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {CATEGORIES.map(({ key, label }) => (
              <button key={key} onClick={() => setCategory(key)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150
                  ${category === key
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30 scale-[1.02]"
                    : "bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-500 hover:border-orange-200"
                  }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-[12px] text-slate-400 font-semibold">
              {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 
          CARDS GRID
       */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
            {filtered.map((r, i) => (
              <div
                key={r.id}
                className="animate-in fade-in slide-in-from-bottom-3 duration-300"
                style={{ animationDelay: `${i * 55}ms`, animationFillMode: "both" }}
              >
                <ResourceCard
                  resource={r}
                  saved={savedIds.has(r.id)}
                  onSave={toggleSave}
                  onPreview={() => {
                    incViews.mutate(r.id);
                    if (r.type === "link") window.open(r.fileUrl, "_blank", "noopener,noreferrer");
                  }}
                  onDownload={() => {
                    incDownloads.mutate(r.id);
                    window.open(r.fileUrl, "_blank", "noopener,noreferrer");
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-5">
              <Search size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-[18px] font-extrabold text-slate-700 dark:text-slate-200 mb-2">No resources found</h3>
            <p className="text-[13px] text-slate-400 mb-6">Try a different search term or category.</p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 transition-all"
            >
              Clear filters <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}