"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
} from '@/components/ui/sidebar'
import {
  CircleDot,
  GitBranch,
  Regex,
  FileCode,
  Layers,
  Cpu,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Settings,
  ArrowRightLeft,
  Minimize2,
  Binary,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const automataModules = [
  {
    title: 'DFA Simulator',
    href: '/dfa',
    icon: CircleDot,
    description: 'Deterministic Finite Automaton',
  },
  {
    title: 'NFA Simulator',
    href: '/nfa',
    icon: GitBranch,
    description: 'Non-deterministic Finite Automaton',
  },
  {
    title: 'ε-NFA Simulator',
    href: '/epsilon-nfa',
    icon: GitBranch,
    description: 'NFA with epsilon transitions',
  },
]

const regexModules = [
  {
    title: 'Regex Tester',
    href: '/regex',
    icon: Regex,
    description: 'Test regular expressions',
  },
  {
    title: 'Regex to NFA',
    href: '/regex-to-nfa',
    icon: ArrowRightLeft,
    description: "Thompson's construction",
  },
]

const conversionModules = [
  {
    title: 'NFA to DFA',
    href: '/nfa-to-dfa',
    icon: ArrowRightLeft,
    description: 'Subset construction',
  },
  {
    title: 'DFA Minimization',
    href: '/minimize',
    icon: Minimize2,
    description: 'Table-filling method',
  },
  {
    title: 'Table to Diagram',
    href: '/table-to-diagram',
    icon: GitBranch,
    description: 'Transition table to visual diagram',
    highlight: true,
  },
]

const advancedModules = [
  {
    title: 'CFG Editor',
    href: '/cfg',
    icon: FileCode,
    description: 'Context-Free Grammars',
    comingSoon: true,
  },
  {
    title: 'PDA Simulator',
    href: '/pda',
    icon: Layers,
    description: 'Pushdown Automata',
    comingSoon: true,
  },
  {
    title: 'Turing Machine',
    href: '/tm',
    icon: Cpu,
    description: 'Universal computation',
    comingSoon: true,
  },
]

const learningModules = [
  {
    title: 'Learning Studio',
    href: '/studio',
    icon: GraduationCap,
    description: 'Interactive whiteboard',
    highlight: true,
  },
  {
    title: 'Examples',
    href: '/examples',
    icon: Lightbulb,
    description: 'Pre-built automata',
  },
  {
    title: 'Tutorials',
    href: '/tutorials',
    icon: BookOpen,
    description: 'Learn the concepts',
    comingSoon: true,
  },
  {
    title: 'Cheat Sheet',
    href: '/cheatsheet',
    icon: HelpCircle,
    description: 'Quick reference',
    comingSoon: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const renderMenuItem = (item: typeof automataModules[0] & { comingSoon?: boolean; highlight?: boolean }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          disabled={item.comingSoon}
          tooltip={item.description}
        >
          <Link
            href={item.comingSoon ? '#' : item.href}
            className={cn(
              item.comingSoon && 'opacity-50 cursor-not-allowed',
              item.highlight && 'bg-primary/10 hover:bg-primary/20'
            )}
          >
            <Icon className={cn("h-4 w-4", item.highlight && "text-primary")} />
            <span className={cn(item.highlight && "font-medium text-primary")}>{item.title}</span>
            {item.comingSoon && (
              <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                Soon
              </span>
            )}
            {item.highlight && (
              <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                New
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar 
      variant="floating"
      className="!bg-transparent"
      style={{
        '--sidebar': 'transparent',
        '--sidebar-border': 'oklch(0.28 0.02 285 / 0.3)',
        'backdropFilter': 'blur(12px)',
        'WebkitBackdropFilter': 'blur(12px)',
        backgroundColor: 'oklch(0.17 0.015 285 / 0.4)',
        borderRight: '1px solid oklch(0.28 0.02 285 / 0.3)'
      } as React.CSSProperties}
    >
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Binary className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">AutomataLab</h1>
            <p className="text-xs text-muted-foreground">Theory of Computation</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Finite Automata</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {automataModules.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Regular Expressions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {regexModules.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conversions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversionModules.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Advanced</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedModules.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningModules.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
