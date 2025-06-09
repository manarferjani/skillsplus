"use client"

import { Outlet } from "@tanstack/react-router"
import {
  IconBrowserCheck,
  IconNotification,
  IconPalette,
  IconTool,
  IconUser,
  IconSettings,
} from "@tabler/icons-react"
import { Header } from "@/components/layout/header"
import { Main } from "@/components/layout/main"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Search } from "@/components/search"
import { ThemeSwitch } from "@/components/theme-switch"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedBackground } from "@/features/settings/components/animated-background"
import CreativeSidebarNav from "@/features/settings/components/creative-sidebar-nav"

export default function Settings() {
  return (
    <>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        {/* Hero Section */}
        <div className="relative overflow-auto rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 p-8 mb-8">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                <IconSettings size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent md:text-4xl">
                  Settings
                </h1>
                <p className="text-muted-foreground mt-1">Customize your experience and manage preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col space-y-6 overflow-auto lg:flex-row lg:space-x-8 lg:space-y-0">
          {/* Creative Sidebar */}
          <aside className="lg:w-80">
            <Card className="sticky top-0 border-0 shadow-xl bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-950/50">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Configure your account and preferences</h3>
                </div>
                {/* Using the CreativeSidebarNav component */}
                <CreativeSidebarNav
                  items={sidebarNavItems.map((item) => ({
                    ...item,
                    badge: item.title === "Notifications" ? "3" : undefined,
                    isNew: item.title === "Display",
                  }))}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <Card className="h-full border-0 shadow-xl overflow-auto bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-gray-900 dark:via-gray-950/30 dark:to-gray-900">
              <CardContent className="p-8 h-full">
                <Outlet />
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

const sidebarNavItems = [
  {
    title: "Profile",
    icon: <IconUser size={18} />,
    href: "/settings",
  },
  {
    title: "Account",
    icon: <IconTool size={18} />,
    href: "/settings/account",
  },
  {
    title: "Appearance",
    icon: <IconPalette size={18} />,
    href: "/settings/appearance",
  },
  {
    title: "Notifications",
    icon: <IconNotification size={18} />,
    href: "/settings/notifications",
  },
  {
    title: "Display",
    icon: <IconBrowserCheck size={18} />,
    href: "/settings/display",
  },
]
