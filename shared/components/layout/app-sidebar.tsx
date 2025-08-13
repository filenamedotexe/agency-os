"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/shared/hooks/use-toast"
import { createClient } from "@/shared/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import type { UserRole, Profile } from "@/shared/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar"
import { designSystem as ds } from "@/shared/lib/design-system"
import {
  Users,
  Briefcase,
  Settings,
  LayoutDashboard,
  UserCircle,
  MessageCircle,
  BookOpen,
  LogOut
} from "lucide-react"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "team_member", "client"]
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
    roles: ["admin", "team_member"]
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageCircle,
    roles: ["admin", "team_member"]
  },
  {
    title: "Knowledge Hub",
    url: "/knowledge",
    icon: BookOpen,
    roles: ["admin", "team_member", "client"]
  },
  {
    title: "Services",
    url: "/services",
    icon: Briefcase,
    roles: ["admin", "team_member", "client"]
  },
  {
    title: "Profile",
    url: "/profile",
    icon: UserCircle,
    roles: ["client"]
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    roles: ["admin"]
  }
]

interface AppSidebarProps {
  userRole: UserRole
  user?: Profile
}

export function AppSidebar({ userRole, user }: AppSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNavItems = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  // Get user initials for avatar
  const getUserInitials = (email?: string) => {
    if (!email) return "U"
    const parts = email.split("@")[0].split(".")
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">AO</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AgencyOS</span>
                  <span className="truncate text-xs">Management Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 sm:p-4 px-3 sm:px-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getUserInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.email?.split('@')[0]}</span>
                <span className="truncate text-xs capitalize">{userRole.replace('_', ' ')}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} disabled={isLoading}>
              <LogOut className="h-4 w-4" />
              <span>{isLoading ? "Signing out..." : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}