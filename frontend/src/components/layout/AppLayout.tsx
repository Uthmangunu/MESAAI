import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Calendar, BarChart3, Settings, LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';

export default function AppLayout() {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col justify-between p-4 hidden md:flex">
                <div>
                    <div className="mb-8 px-2">
                        <Logo />
                    </div>

                    <nav className="space-y-1">
                        <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Home" />
                        <NavItem to="/agents" icon={<Users size={20} />} label="Agents" />
                        <NavItem to="/inbox" icon={<MessageSquare size={20} />} label="Inbox" />
                        <NavItem to="/bookings" icon={<Calendar size={20} />} label="Bookings" />
                        <NavItem to="/leads" icon={<BarChart3 size={20} />} label="Leads" />
                    </nav>
                </div>

                <div>
                    <div className="mb-4 px-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workspace</p>
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                                TC
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">Tech Corp Inc.</p>
                                <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                            </div>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all">
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background">
                {/* Mobile Header Placeholder */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md">
                    <Logo />
                    <button className="text-muted-foreground">Menu</button>
                </div>
                <Outlet />
            </main>
        </div>
    );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )
            }
        >
            {({ isActive }) => (
                <>
                    {icon}
                    <span>{label}</span>
                    {isActive && (
                        <motion.span
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                </>
            )}

        </NavLink>
    );
}

import { motion } from 'framer-motion';
