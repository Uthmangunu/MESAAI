import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Globe, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo className="scale-110" />
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-muted-foreground">
                        <a href="#features" className="hover:text-primary transition-colors">Capabilities</a>
                        <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/auth">
                            <Button variant="ghost" className="font-semibold uppercase tracking-wider text-xs">Log In</Button>
                        </Link>
                        <Link to="/auth">
                            <Button className="font-bold uppercase tracking-wider text-xs px-6">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 border-b border-white/10">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12">
                    <div className="lg:col-span-8 space-y-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-6xl md:text-8xl lg:text-[7rem] font-bold leading-[0.9] tracking-tighter text-white"
                        >
                            YOUR <br />
                            WORKFORCE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-400 to-secondary">REIMAGINED.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed"
                        >
                            Deploy intelligent AI agents that handle calls, bookings, and customer support 24/7.
                            Seamlessly integrated into your business.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 pt-4"
                        >
                            <Link to="/auth">
                                <Button size="lg" className="h-14 px-8 text-base uppercase tracking-widest font-bold rounded-none border border-primary bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all">
                                    Deploy Your First Agent
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-base uppercase tracking-widest font-bold rounded-none border-white/20 hover:border-white hover:bg-white/5 transition-all">
                                View Demo
                            </Button>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-4 relative hidden lg:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-[100px] opacity-50" />
                        <div className="relative border border-white/10 bg-slate-900/50 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl">
                            {/* Window Header */}
                            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <div className="ml-4 text-[10px] text-slate-500 font-mono flex-1 text-center">active_session_442.log</div>
                            </div>

                            {/* Conversation Content */}
                            <div className="p-6 space-y-6 font-mono text-sm max-h-[400px] overflow-hidden">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        AI
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-primary font-bold">Amara (Receptionist)</div>
                                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 text-slate-300">
                                            Hello! Thanks for calling Tech Corp. This is Amara. How can I assist you with your booking today?
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                        U
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="text-xs text-slate-500 font-bold">User</div>
                                        <div className="bg-primary/20 p-3 rounded-lg rounded-tr-none border border-primary/20 text-white inline-block text-left">
                                            Hi Amara, I need to reschedule my appointment from Tuesday to Thursday afternoon.
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        AI
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-primary font-bold">Amara (Receptionist)</div>
                                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 text-slate-300">
                                            <p>I can help with that. checking availability for Thursday...</p>
                                            <div className="mt-3 bg-black/30 p-2 rounded border border-white/5 flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-secondary" />
                                                <span className="text-xs text-slate-400">Searching Calendar...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        AI
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 text-slate-300">
                                        I have openings at <strong>2:00 PM</strong> and <strong>4:30 PM</strong> on Thursday. Which works best for you?
                                    </div>
                                </div>
                            </div>

                            {/* Input Area (Visual Only) */}
                            <div className="p-4 border-t border-white/10 bg-white/5">
                                <div className="h-10 bg-black/50 rounded border border-white/10 flex items-center px-4 text-slate-600 text-xs">
                                    User is typing...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid Stats features */}
            <section className="border-b border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <FeatureCell
                        icon={<Globe className="w-8 h-8 text-primary" />}
                        title="Global Reach"
                        desc="Agents that speak 30+ languages fluently."
                        color="primary"
                    />
                    <FeatureCell
                        icon={<Zap className="w-8 h-8 text-amber-400" />}
                        title="Instant Scale"
                        desc="Handle 1 or 1,000 concurrent calls effortlessly."
                        color="amber-400"
                    />
                    <FeatureCell
                        icon={<Shield className="w-8 h-8 text-white" />}
                        title="Enterprise Secure"
                        desc="Bank-grade encryption for all client data."
                        color="white"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10 bg-black">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <Logo />
                    <p className="text-slate-500 text-sm">© 2025 Mesa AI Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCell({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
    const glowClass = color === 'primary' ? 'group-hover:bg-primary/10 group-hover:border-primary/20' :
        color === 'amber-400' ? 'group-hover:bg-amber-400/10 group-hover:border-amber-400/20' :
            'group-hover:bg-white/10 group-hover:border-white/20';

    return (
        <div className="p-10 border-r border-white/5 last:border-r-0 hover:bg-white/5 transition-colors group flex flex-col items-center text-center">
            <div className={`mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 ${glowClass} transition-all duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight font-heading">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm max-w-xs">{desc}</p>
        </div>
    )
}
