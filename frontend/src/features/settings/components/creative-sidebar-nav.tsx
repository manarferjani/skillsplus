"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { IconChevronRight } from "@tabler/icons-react"

interface SidebarNavItem {
  title: string
  icon: React.ReactNode
  href: string
  badge?: string
  isNew?: boolean
}

interface CreativeSidebarNavProps {
  items: SidebarNavItem[]
  className?: string
}

export function CreativeSidebarNav({ items, className }: CreativeSidebarNavProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item, index) => (
        <SidebarNavItem key={item.href} item={item} index={index} />
      ))}
    </nav>
  )
}

function SidebarNavItem({ item, index }: { item: SidebarNavItem; index: number }) {
  // You would typically use your router's active state here
  const isActive = window.location.pathname === item.href

  return (
    <a
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ease-out",
        "hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-950/50 dark:hover:to-purple-950/50",
        "hover:shadow-lg hover:shadow-violet-500/10 hover:scale-[1.02] hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-2",
        isActive
          ? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 shadow-lg shadow-violet-500/20"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Animated background */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 to-purple-500/0 transition-all duration-300",
          "group-hover:from-violet-500/5 group-hover:to-purple-500/5",
          isActive && "from-violet-500/10 to-purple-500/10",
        )}
      />

      {/* Icon container */}
      <div
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
          "group-hover:scale-110",
          isActive
            ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30"
            : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-violet-100 group-hover:to-purple-100 dark:group-hover:from-violet-900/50 dark:group-hover:to-purple-900/50",
        )}
      >
        {item.icon}

        {/* Pulse effect for active state */}
        {isActive && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 animate-ping opacity-20" />
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate">{item.title}</span>
          <div className="flex items-center gap-2">
            {item.badge && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {item.badge}
              </Badge>
            )}
            {item.isNew && (
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Arrow indicator */}
      <IconChevronRight
        size={16}
        className={cn(
          "transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
          isActive && "opacity-100 translate-x-1 text-violet-600",
        )}
      />

      {/* Active indicator line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
      )}
    </a>
  )
}

export default CreativeSidebarNav
