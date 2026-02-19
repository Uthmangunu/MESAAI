import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Github, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
    const [isLogin, setIsLogin] = React.useState(true);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [orgName, setOrgName] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                navigate('/app');
            } else {
                const res = await signup(email, password, orgName);
                // Show confirmation message, then switch to login
                setError(res.message);
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-[#020817] text-white">
            {/* Left Panel - Branding */}
            <div className="hidden w-1/2 flex-col justify-between bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020817] to-[#020817] p-12 lg:flex relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] opacity-20"></div>
                </div>
                <div className="z-10">
                    <Logo className="text-3xl" />
                </div>
                <div className="z-10 max-w-md space-y-4">
                    <h1 className="text-5xl font-bold tracking-tight text-white">
                        Your AI Workforce, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Reimagined.</span>
                    </h1>
                    <p className="text-lg text-slate-400">
                        Deploy intelligent agents that handle your calls, messages, and bookings 24/7.
                        Seamlessly integrated. Beautifully designed.
                    </p>
                </div>
                <div className="z-10 text-sm text-slate-500">
                    © 2025 Mesa AI Inc.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
                <div className="w-full max-w-sm space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="lg:hidden mx-auto mb-4">
                            <Logo className="text-2xl" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-sm text-slate-400">
                            {isLogin ? "Sign in to your account" : "Enter your details to get started"}
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4">
                                {!isLogin && (
                                    <Input
                                        placeholder="Company name"
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        required
                                        className="bg-slate-900/50 border-slate-800 focus:border-primary/50 text-white placeholder:text-slate-500"
                                    />
                                )}
                                <Input
                                    placeholder="name@example.com"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-800 focus:border-primary/50 text-white placeholder:text-slate-500"
                                />
                                <Input
                                    placeholder="Password"
                                    type="password"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="bg-slate-900/50 border-slate-800 focus:border-primary/50 text-white placeholder:text-slate-500"
                                />

                                {error && (
                                    <p className={`text-sm text-center ${error.includes('Check your email') ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-bold disabled:opacity-50"
                                >
                                    {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
                                </Button>
                            </div>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#020817] px-2 text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-300">
                                <Github className="mr-2 h-4 w-4" /> Github
                            </Button>
                            <Button variant="outline" className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-300">
                                <Globe className="mr-2 h-4 w-4" /> Google
                            </Button>
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-sm text-primary hover:underline"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
