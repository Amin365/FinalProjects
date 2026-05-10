import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setDesktopLauncher } from "@/app/CommonnSlice";
import { DesktopPermissions } from "./DesktopPermissions";
import { motion as Motion } from "framer-motion";
function DesktopLauncher({ onClose, onModuleOpen }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user);
  const closeLauncher = onClose || (() => dispatch(setDesktopLauncher(false)));

  const modules = useMemo(() => DesktopPermissions(user), [user]);
  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter((module) => module.name.toLowerCase().includes(query));
  }, [modules, search]);

  const openModule = (module) => {
    if (!module?.link) return;
    navigate(module.link);
    onModuleOpen?.(module);
    closeLauncher();
  };

  return (
    <div className="relative min-h-[calc(100svh-72px)] overflow-y-auto  text-slate-900  dark:text-slate-100">
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,rgba(226,232,240,0.78),rgba(148,163,184,0.42)),linear-gradient(135deg,#f8fafc_0%,#cbd5e1_48%,#94a3b8_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.58)),linear-gradient(135deg,#111827_0%,#334155_48%,#0f172a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:58px_58px] opacity-40 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)]" /> */}

      <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-[1360px] flex-col px-4 py-10 sm:px-8">
        <Motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto mb-16 flex w-full max-w-[1310px] items-center rounded-lg bg-white/90 shadow-xl"
        >
          <Search className="ml-6 text-slate-500" size={22} />
          <input
            type="text"
            placeholder="Search menus..."
            className="h-12 w-full rounded-lg bg-transparent px-4 text-lg text-slate-700 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />
        </Motion.div>

        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-2 justify-items-center gap-x-8 gap-y-20 pb-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Motion.button
                  key={module.link || module.name}
                  type="button"
                  onClick={() => openModule(module)}
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.08, y: -6 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.22, delay: index * 0.02, ease: "easeOut" }}
                  className="group flex w-32 flex-col items-center text-center outline-none"
                >
                  <span className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-slate-200 text-orange-600 shadow-[0_18px_38px_rgba(15,23,42,0.35)] ring-1 ring-white/40 transition group-hover:bg-white group-hover:shadow-[0_0_36px_rgba(249,115,22,0.36)]">
                    {Icon ? <Icon size={40} strokeWidth={1.85} /> : null}
                  </span>
                  <span className="mt-4 w-full text-center text-lg font-bold text-slate-800 drop-shadow dark:text-slate-100">
                    {module.name}
                  </span>
                </Motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-[360px] flex-col items-center justify-center text-slate-200">
            <h2 className="text-2xl font-semibold">No menus found</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default DesktopLauncher;
