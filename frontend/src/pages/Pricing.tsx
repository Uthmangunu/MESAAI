import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Pricing() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
            <Header />

            <main className="pt-32 px-6">
                <div className="max-w-[1400px] mx-auto space-y-24 pb-24">
                    {/* Hero */}
                    <section className="space-y-6 text-center max-w-3xl mx-auto">
                        <h1 className="text-6xl md:text-8xl font-bold font-heading tracking-tighter text-white">
                            SIMPLE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">PRICING.</span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed">
                            Start small and scale as you grow. Transparent pricing with no hidden fees.
                        </p>
                    </section>

                    {/* Pricing Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PriceCard
                            name="Starter"
                            price="$49"
                            desc="Perfect for small businesses sending their first messages."
                            features={['1 AI Agent', '500 Messages/mo', 'Email Support', 'Basic Analytics']}
                        />
                        <PriceCard
                            name="Professional"
                            price="$149"
                            desc="For growing teams that need voice and multi-channel support."
                            features={['3 AI Agents', '5,000 Messages/mo', 'Voice & WhatsApp', 'Advanced Analytics', 'Priority Support']}
                            popular
                        />
                        <PriceCard
                            name="Enterprise"
                            price="Custom"
                            desc="Unlimited scale for large organizations."
                            features={['Unlimited Agents', 'Unlimited Messages', 'SSO & Custom Integrations', 'Dedicated Success Manager', 'SLA Guarantee']}
                        />
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function PriceCard({ name, price, desc, features, popular }: { name: string, price: string, desc: string, features: string[], popular?: boolean }) {
    return (
        <div className={`p-8 border bg-white/5 rounded-xl flex flex-col relative ${popular ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
            {popular && <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>}

            <div className="mb-6 space-y-2">
                <h3 className="text-2xl font-bold font-heading text-white">{name}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white tracking-tight">{price}</span>
                    {price !== 'Custom' && <span className="text-slate-500">/month</span>}
                </div>
                <p className="text-sm text-slate-400">{desc}</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
                {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                    </div>
                ))}
            </div>

            <Button className={`w-full py-6 font-bold uppercase tracking-wider ${popular ? 'bg-primary text-black hover:bg-primary/90' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
            </Button>
        </div>
    )
}

function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/"><Logo className="scale-110" /></Link>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-muted-foreground font-heading">
                    <Link to="/capabilities" className="hover:text-primary transition-colors">Capabilities</Link>
                    <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
                    <Link to="/pricing" className="text-primary transition-colors">Pricing</Link>
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
