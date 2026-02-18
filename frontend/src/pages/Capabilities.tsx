import React from 'react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Globe, MessageSquare, Phone, Calendar, BarChart3, Users } from 'lucide-react';

export default function Capabilities() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
            <Header />

            <main className="pt-32 px-6">
                <div className="max-w-[1400px] mx-auto space-y-24 pb-24">
                    {/* Hero */}
                    <section className="space-y-6">
                        <h1 className="text-6xl md:text-8xl font-bold font-heading tracking-tighter text-white">
                            BUILT FOR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">SCALE.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                            Mesa provides a comprehensive suite of AI capabilities designed to handle complex business workflows autonomously.
                        </p>
                    </section>

                    {/* Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CapabilityCard
                            icon={<Phone className="w-8 h-8 text-primary" />}
                            title="Voice AI"
                            desc="Natural, human-like voice agents that can handle inbound/outbound calls, screen leads, and book appointments in real-time."
                        />
                        <CapabilityCard
                            icon={<MessageSquare className="w-8 h-8 text-secondary" />}
                            title="Multi-Channel Chat"
                            desc="Unified inbox for WhatsApp, Email, Slack, and Webchat. Your agents respond instantly across all platforms."
                        />
                        <CapabilityCard
                            icon={<Calendar className="w-8 h-8 text-blue-400" />}
                            title="Autonomous Scheduling"
                            desc="Deep integration with Google Calendar and Calendly. Agents negotiate times and book slots without human intervention."
                        />
                        <CapabilityCard
                            icon={<Globe className="w-8 h-8 text-emerald-400" />}
                            title="30+ Languages"
                            desc="Break language barriers. Mesa agents automatically detect and switch languages to converse fluently with your global customers."
                        />
                        <CapabilityCard
                            icon={<BarChart3 className="w-8 h-8 text-yellow-400" />}
                            title="Real-Time Analytics"
                            desc="Track sentiment, resolution times, and conversion rates. Get actionable insights from every interaction."
                        />
                        <CapabilityCard
                            icon={<Users className="w-8 h-8 text-pink-400" />}
                            title="CRM Sync"
                            desc="Automatically update your CRM (HubSpot, Salesforce) with lead details, conversation summaries, and next steps."
                        />
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function CapabilityCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 border border-white/10 bg-white/5 rounded-none hover:border-primary/50 transition-all group">
            <div className="mb-6 bg-slate-900/50 p-3 rounded-lg w-fit group-hover:bg-background transition-colors border border-white/5">{icon}</div>
            <h3 className="text-2xl font-bold font-heading mb-3 text-white">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/"><Logo className="scale-110" /></Link>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-muted-foreground font-heading">
                    <Link to="/capabilities" className="text-primary transition-colors">Capabilities</Link>
                    <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
                    <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link to="/auth">
                        <Button variant="ghost" className="font-semibold uppercase tracking-wider text-xs font-heading">Log In</Button>
                    </Link>
                    <Link to="/auth">
                        <Button className="font-bold uppercase tracking-wider text-xs px-6 font-heading">Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}

function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-white/10 bg-black">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <Logo />
                <p className="text-slate-500 text-sm">© 2025 Mesa AI Inc. All rights reserved.</p>
            </div>
        </footer>
    )
}
