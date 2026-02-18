import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Activity, MessageSquare, Calendar, Users, MoreHorizontal, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { mockApi } from '../lib/mockApi';

export default function Dashboard() {
    const stats = mockApi.getStats();
    const agents = mockApi.getAgents();
    const activity = mockApi.getActivityFeed();

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1 font-heading">Overview</h1>
                    <p className="text-muted-foreground">Welcome back, here's what's happening in your workspace.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 border-border bg-card hover:bg-muted text-muted-foreground hover:text-white">
                        Export Data
                    </Button>
                    <Button className="h-10 bg-primary text-black hover:bg-primary/90 font-semibold shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                        + New Agent
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Messages"
                    value={stats.totalMessages.value}
                    change={stats.totalMessages.change}
                    trend={stats.totalMessages.trend}
                    icon={<MessageSquare className="h-5 w-5 text-primary" />}
                />
                <StatCard
                    title="Active Bookings"
                    value={stats.activeBookings.value}
                    change={stats.activeBookings.change}
                    trend={stats.activeBookings.trend}
                    icon={<Calendar className="h-5 w-5 text-secondary" />}
                />
                <StatCard
                    title="Leads Captured"
                    value={stats.leadsCaptured.value}
                    change={stats.leadsCaptured.change}
                    trend={stats.leadsCaptured.trend}
                    icon={<Users className="h-5 w-5 text-blue-400" />}
                />
                <StatCard
                    title="Avg. Response Time"
                    value={stats.avgResponseTime.value}
                    change={stats.avgResponseTime.change}
                    trend={stats.avgResponseTime.trend}
                    icon={<Activity className="h-5 w-5 text-emerald-400" />}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Agents Overview */}
                <Card className="col-span-2 bg-card/30 backdrop-blur-xl border-border/60 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
                        <CardTitle className="text-lg font-semibold text-white font-heading">Active Agents</CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {agents.map(agent => (
                                <AgentRow key={agent.id} {...agent} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg h-full">
                    <CardHeader className="border-b border-border/40 pb-4">
                        <CardTitle className="text-lg font-semibold text-white font-heading">Live Feed</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[1px] before:bg-border/60">
                            {activity.map(item => (
                                <ActivityItem
                                    key={item.id}
                                    title={item.title}
                                    desc={item.desc}
                                    time={item.time}
                                    icon={getIconForType(item.type)}
                                    iconBg={item.bg}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function getIconForType(type: string) {
    const className = "h-3.5 w-3.5";
    switch (type) {
        case 'booking': return <Calendar className={`${className} text-black`} />;
        case 'lead': return <Users className={`${className} text-white`} />;
        case 'call': return <Phone className={`${className} text-white`} />;
        case 'email': return <Mail className={`${className} text-black`} />;
        default: return <Activity className={`${className} text-white`} />;
    }
}

function StatCard({ title, value, change, trend, icon }: { title: string, value: string, change: string, trend: string, icon: React.ReactNode }) {
    const trendColor = trend === 'up' || trend === 'down-good' ? 'text-emerald-400' : 'text-red-400';
    const trendIcon = trend === 'up' ? '↗' : '↘';

    return (
        <Card className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors font-heading">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-background/50 border border-border group-hover:border-primary/30 transition-colors">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${trendColor}`}>
                    {change} <span className="text-[10px]">{trendIcon}</span> <span className="text-muted-foreground ml-1 font-normal">from yesterday</span>
                </div>
            </CardContent>
        </Card>
    )
}

function AgentRow({ name, role, status, avatarColor, channels, activity, initial }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className={`w-12 h-12 rounded-xl ${avatarColor} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {initial}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    {status === 'active' && <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-white group-hover:text-primary transition-colors font-heading">{name}</h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-1">
                <div className="flex gap-1.5">
                    {channels.map((c: string) => (
                        <div key={c} className="bg-background border border-border px-2 py-0.5 rounded-md text-[10px] uppercase text-muted-foreground font-semibold tracking-wide">
                            {c}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {activity}
                </p>
            </div>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </div>
        </div>
    )
}

function ActivityItem({ title, desc, time, icon, iconBg }: any) {
    return (
        <div className="flex items-start gap-4 relative z-10">
            <div className={`rounded-full ${iconBg} p-1.5 mt-0.5 shadow-lg shadow-black/50 border border-white/10`}>
                {icon}
            </div>
            <div className="flex-1 space-y-1 pb-1">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-white leading-none font-heading">{title}</p>
                    <span className="text-[10px] text-muted-foreground font-medium">{time}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    )
}
