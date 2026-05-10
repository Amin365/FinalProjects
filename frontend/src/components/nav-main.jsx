

import React from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavLink } from "react-router"
import { Book as BookIcon } from "lucide-react"

export function NavMain({ items = [], iconOnly = false }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
        <BookIcon className="h-4 w-4 text-slate-500 dark:text-gray-300" />
        {!iconOnly ? <span className="text-base">DPL</span> : null}
      </SidebarGroupLabel>

      <SidebarMenu className="mt-12 space-y-3  text-base">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2  transition-colors",
                    "text-sm font-medium truncate",
                    isActive
                      ? " text-slate-900  dark:text-white"
                      : "text-slate-700  dark:text-gray-300 ",
                  ].join(" ")
                }
              >
                {item.icon ? (
                  <item.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <BookIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
                {!iconOnly ? <span className="truncate ">{item.title}</span> : null}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default NavMain
