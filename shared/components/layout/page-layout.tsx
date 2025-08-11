"use client"

import { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { designSystem as ds } from "@/shared/lib/design-system"

interface PageLayoutProps {
  children: ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn(ds.layout.dashboard.container, className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  description, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(ds.patterns.pageHeader, className)}>
      <div className={ds.layout.flex.between}>
        <div className={ds.spacing.section.gap}>
          <div>
            <h1 className={ds.typography.page.title}>{title}</h1>
            {subtitle && (
              <p className={ds.typography.page.subtitle}>{subtitle}</p>
            )}
          </div>
          {description && (
            <p className={ds.typography.page.description}>{description}</p>
          )}
        </div>
        {actions && (
          <div className={ds.layout.flex.end}>{actions}</div>
        )}
      </div>
    </div>
  )
}

interface PageContentProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function PageContent({ 
  children, 
  className,
  noPadding = false 
}: PageContentProps) {
  return (
    <div className={cn(
      !noPadding && ds.patterns.pageContent,
      ds.layout.dashboard.content,
      className
    )}>
      {children}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function SectionHeader({ 
  title, 
  subtitle, 
  actions, 
  className 
}: SectionHeaderProps) {
  return (
    <div className={cn(ds.layout.flex.between, className)}>
      <div>
        <h2 className={ds.typography.section.title}>{title}</h2>
        {subtitle && (
          <p className={ds.typography.section.subtitle}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={ds.layout.flex.end}>{actions}</div>
      )}
    </div>
  )
}

interface ContentGridProps {
  children: ReactNode
  columns?: "2" | "3" | "sidebar"
  className?: string
}

export function ContentGrid({ 
  children, 
  columns = "2",
  className 
}: ContentGridProps) {
  const gridClass = {
    "2": ds.layout.grid.twoColumn,
    "3": ds.layout.grid.threeColumn,
    "sidebar": ds.layout.grid.sidebar,
  }[columns]
  
  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  )
}

interface StatGridProps {
  children: ReactNode
  className?: string
}

export function StatGrid({ children, className }: StatGridProps) {
  return (
    <div className={cn(ds.layout.grid.stats, className)}>
      {children}
    </div>
  )
}