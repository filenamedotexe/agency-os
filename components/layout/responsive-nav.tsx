"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  Users,
  Briefcase,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  UserCircle,
  ChevronLeft,
  LogOut
} from "lucide-react"

type UserRole = "admin" | "team_member" | "client"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "team_member", "client"]
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    roles: ["admin", "team_member"]
  },
  {
    title: "Services",
    href: "/services",
    icon: Briefcase,
    roles: ["admin", "team_member", "client"]
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle,
    roles: ["client"]
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"]
  }
]

interface ResponsiveNavProps {
  userRole: UserRole
  user?: any
}

export function ResponsiveNav({ userRole, user }: ResponsiveNavProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const filteredNavItems = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  const NavItems = () => (
    <>
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            onClick={() => isMobile && setIsSidebarOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline-block lg:inline-block">{item.title}</span>
          </Link>
        )
      })}
    </>
  )

  if (isMobile) {
    // Mobile Bottom Navigation
    return (
      <>
        {/* Top Header Bar for Mobile */}
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b bg-background px-4 md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center border-b px-4">
                  <h2 className="text-lg font-semibold">AgencyOS</h2>
                </div>
                <ScrollArea className="flex-1 px-3 py-4">
                  <nav className="flex flex-col gap-2">
                    <NavItems />
                  </nav>
                </ScrollArea>
                <div className="border-t p-4">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold">AgencyOS</h1>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </header>

        {/* Bottom Tab Navigation for Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </>
    )
  }

  // Desktop/Tablet Sidebar
  return (
    <aside className="hidden md:flex md:w-16 lg:w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="hidden lg:inline-block">AgencyOS</span>
          <span className="lg:hidden">AO</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-2">
          <NavItems />
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="hidden lg:block">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <LogOut className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline-block">Sign out</span>
        </Button>
      </div>
    </aside>
  )
}