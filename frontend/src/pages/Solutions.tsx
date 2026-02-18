import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

export default function Solutions() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
            <Header />

            <main className="pt-32 px-6">
                <div className="max-w-[1400px] mx-auto space-y-24 pb-24">
                    {/* Hero */}
                    <section className="space-y-6">
                        <h1 className="text-6xl md:text-8xl font-bold font-heading tracking-tighter text-white">
                            SOLUTIONS FOR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">EVERY INDUSTRY.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                            Tailored AI workflows optimize for specific business needs, from high-volume call centers to boutique agencies.
                        </p>
                    </section>

                    {/* Industries */}
                    <section className="grid grid-cols-1 gap-12">
                        <SolutionRow
                            title="Real Estate"
                            desc="Qualify leads, schedule viewings, and answer property questions instantly. Never miss a potential buyer."
                            features={['24/7 Inquiry Handling', 'MLS Integration', 'Automated Follow-ups']}
                            image="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            align="left"
                        />
                        <SolutionRow
                            title="Healthcare"
                            desc="Handle patient appointments, prescription refill requests, and general FAQs with HIPAA-compliant AI agents."
                            features={['Secure Patient Data', 'EMR Integration', 'Appointment Reminders']}
                            image="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            align="right"
                        />
                        <SolutionRow
                            title="E-Commerce"
                            desc="Support customers with order tracking, returns, and product recommendations via chat and email."
                            features={['Order Status Lookup', 'Shopify/WooCommerce Sync', 'Personalized Support']}
                            image="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            align="left"
                        />
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function SolutionRow({ title, desc, features, image, align }: { title: string, desc: string, features: string[], image: string, align: 'left' | 'right' }) {
    return (
        <div className={`flex flex-col ${align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
            <div className="lg:w-1/2 space-y-6">
                <h3 className="text-4xl font-bold font-heading text-white">{title}</h3>
                <p className="text-lg text-slate-400 leading-relaxed">{desc}</p>
                <ul className="space-y-3 pt-4">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Check size={14} />
                            </div>
                            {f}
                        </li>
                    ))}
                </ul>
                <div className="pt-6">
                    <Button variant="outline" className="group">
                        Explore Solution <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
            <div className="lg:w-1/2">
                <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden border border-white/10 relative group">
                    <div className="absolute inset-0 bg-primary/20 mix-blend-overlay group-hover:opacity-0 transition-opacity" />
                    <img src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
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
                    <Link to="/solutions" className="text-primary transition-colors">Solutions</Link>
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
