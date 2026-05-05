"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ParticleSwarm from '@/components/particle-swarm'
import {
  CircleDot,
  GitBranch,
  Regex,
  ArrowRightLeft,
  Minimize2,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  Zap,
} from 'lucide-react'

const features = [
  {
    icon: CircleDot,
    title: 'DFA Simulator',
    description: 'Build and simulate Deterministic Finite Automata with step-by-step visualization.',
    href: '/dfa',
    color: 'text-blue-500',
  },
  {
    icon: GitBranch,
    title: 'NFA Simulator',
    description: 'Create Non-deterministic Finite Automata with epsilon transitions.',
    href: '/nfa',
    color: 'text-green-500',
  },
  {
    icon: Regex,
    title: 'Regex Tester',
    description: 'Test regular expressions and convert them to automata.',
    href: '/regex',
    color: 'text-purple-500',
  },
  {
    icon: ArrowRightLeft,
    title: 'NFA to DFA',
    description: 'Convert NFA to DFA using subset construction algorithm.',
    href: '/nfa-to-dfa',
    color: 'text-orange-500',
  },
  {
    icon: Minimize2,
    title: 'DFA Minimization',
    description: 'Minimize DFA using the table-filling method.',
    href: '/minimize',
    color: 'text-pink-500',
  },
  {
    icon: Lightbulb,
    title: 'Examples Library',
    description: 'Learn from pre-built automata examples.',
    href: '/examples',
    color: 'text-yellow-500',
  },
]

const highlights = [
  {
    icon: Sparkles,
    title: 'Visual Editor',
    description: 'Drag-and-drop interface for building automata',
  },
  {
    icon: Zap,
    title: 'Step-by-Step Simulation',
    description: 'Watch your automaton process strings in real-time',
  },
  {
    icon: BookOpen,
    title: 'Educational',
    description: 'Perfect for learning Theory of Computation',
  },
]

export default function HomePage() {
  return (
    <>
      <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <Header title="Home" />
        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <section className="relative py-20 px-6">
            {/* Particle Background */}
            <ParticleSwarm />
            
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
                  Master{' '}
                  <span className="text-primary">Automata Theory</span>{' '}
                  Through Interactive Learning
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
                  AutomataLab is your interactive playground for learning Theory of Computation. 
                  Build, visualize, and simulate DFAs, NFAs, and more with beautiful animations.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/dfa">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/examples">
                      View Examples
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Highlights */}
          <section className="py-12 px-6">
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {highlights.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 px-6">
            <div className="max-w-5xl mx-auto relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold mb-2">Explore the Modules</h2>
                <p className="text-muted-foreground">
                  Everything you need to learn and practice automata theory
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <Link href={feature.href}>
                      <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-200 group">
                        <CardHeader>
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                            <feature.icon className={`h-6 w-6 ${feature.color}`} />
                          </div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Open module
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h2 className="text-2xl font-bold mb-4">Ready to dive in?</h2>
              <p className="text-muted-foreground mb-6">
                Start building your first automaton in seconds. No account required.
              </p>
              <Button asChild size="lg">
                <Link href="/dfa">
                  Build Your First DFA
                </Link>
              </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 px-6">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
              <p className="text-sm text-muted-foreground">
                AutomataLab — Learn Theory of Computation interactively
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/examples" className="hover:text-foreground transition-colors">
                  Examples
                </Link>
                <Link href="/dfa" className="hover:text-foreground transition-colors">
                  DFA
                </Link>
                <Link href="/nfa" className="hover:text-foreground transition-colors">
                  NFA
                </Link>
                <Link href="/regex" className="hover:text-foreground transition-colors">
                  Regex
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
