import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Briefcase, User, Headphones, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useNavigate } from 'react-router-dom';

const STEPS = [
    { id: 'welcome', title: 'Welcome to Mesa' },
    { id: 'role', title: 'Define Role' },
    { id: 'channels', title: 'Connect Channels' },
    { id: 'complete', title: 'Ready' }
];

export default function Onboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            navigate('/app');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Simple Header */}
            <header className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                <Logo />
                <div className="flex gap-2">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className={`h-1 w-8 rounded-full transition-colors ${idx <= currentStep ? 'bg-primary' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-xl w-full"
                    >
                        {currentStep === 0 && (
                            <div className="space-y-6 text-center">
                                <h1 className="text-4xl font-bold tracking-tight">Let's build your first AI Agent.</h1>
                                <p className="text-slate-400 text-lg">Mesa will help you automate your workflows. First, let's get you set up.</p>
                                <Button onClick={nextStep} size="lg" className="w-full h-14 text-lg">Start Setup <ArrowRight className="ml-2 w-5 h-5" /></Button>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-2">What is this agent's primary role?</h2>
                                    <p className="text-slate-400">This helps us tailor the system instructions.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <RoleCard icon={<Briefcase />} title="Receptionist" desc="Handle bookings & inquiries" onClick={nextStep} />
                                    <RoleCard icon={<Headphones />} title="Support" desc="Tech support & updates" onClick={nextStep} />
                                    <RoleCard icon={<User />} title="Sales" desc="Lead qualification" onClick={nextStep} />
                                    <RoleCard icon={<Check />} title="Custom" desc="Build from scratch" onClick={nextStep} />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-2">Connect Communication Channels</h2>
                                    <p className="text-slate-400">Where should your agent be active?</p>
                                </div>
                                <div className="space-y-4">
                                    <ChannelRow icon={<Phone />} label="Voice Line" />
                                    <ChannelRow icon={<MessageSquarePulse />} label="WhatsApp Business" />
                                    <ChannelRow icon={<Mail />} label="Email Integration" />
                                </div>
                                <Button onClick={nextStep} size="lg" className="w-full h-14 mt-8">Continue</Button>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="text-center space-y-8">
                                <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
                                    <Check className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">Ready to Deploy</h2>
                                    <p className="text-slate-400">Your agent is initialized and ready for configuration.</p>
                                </div>
                                <Button onClick={nextStep} size="lg" className="w-full h-14 bg-white text-black hover:bg-slate-200">
                                    Enter Dashboard
                                </Button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function RoleCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="p-6 border border-white/10 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
            <div className="mb-4 text-slate-400 group-hover:text-primary transition-colors">{icon}</div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{desc}</p>
        </button>
    )
}

function ChannelRow({ icon, label }: { icon: React.ReactNode, label: string }) {
    const [active, setActive] = useState(false);
    return (
        <div
            onClick={() => setActive(!active)}
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${active ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-md ${active ? 'bg-primary text-black' : 'bg-slate-800 text-slate-400'}`}>{icon}</div>
                <span className="font-medium">{label}</span>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${active ? 'border-primary bg-primary text-black' : 'border-slate-600'}`}>
                {active && <Check size={14} />}
            </div>
        </div>
    )
}

// Icon for step 2
import { MessageSquare as MessageSquarePulse } from 'lucide-react';
