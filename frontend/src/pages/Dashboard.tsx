import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Activity, MessageSquare, Calendar, Users, ArrowRight, MoreHorizontal, Phone, Mail } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your AI operations for today.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Download Report</Button>
                    <Button>+ New Agent</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Messages"
                    value="1,284"
                    change="+12% from yesterday"
                    icon={<MessageSquare className="h-4 w-4 text-primary" />}
                />
                <StatCard
                    title="Active Bookings"
                    value="14"
                    change="+3 new today"
                    icon={<Calendar className="h-4 w-4 text-primary" />}
                />
                <StatCard
                    title="Leads Captured"
                    value="32"
                    change="+18% conversion rate"
                    icon={<Users className="h-4 w-4 text-primary" />}
                />
                <StatCard
                    title="Avg. Response Time"
                    value="1.2s"
                    change="-0.4s improvement"
                    icon={<Activity className="h-4 w-4 text-primary" />}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Agents Overview */}
                <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-slate-800/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Active Agents</CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <AgentRow
                                name="Amara"
                                role="Receptionist"
                                status="active"
                                avatarColor="bg-primary"
                                channels={['whatsapp', 'voice']}
                                activity="On a call with +234 80..."
                            />
                            <AgentRow
                                name="Tunde"
                                role="Sales Support"
                                status="paused"
                                avatarColor="bg-secondary"
                                channels={['email', 'chat']}
                                activity="Paused by admin"
                            />
                            <AgentRow
                                name="Grace"
                                role="Customer Service"
                                status="active"
                                avatarColor="bg-blue-500"
                                channels={['chat']}
                                activity="Typing reply to Support #442..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-slate-800/50">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <ActivityItem
                                title="New Booking Confirmed"
                                desc="Amara booked an appointment for tomorrow at 2:00 PM."
                                time="2m ago"
                                icon={<Calendar className="h-4 w-4 text-primary" />}
                            />
                            <ActivityItem
                                title="Lead Captured"
                                desc="Tunde collected contact info from Sarah J."
                                time="15m ago"
                                icon={<Users className="h-4 w-4 text-secondary" />}
                            />
                            <ActivityItem
                                title="Voice Call Completed"
                                desc="Incoming call from +234 812..."
                                time="42m ago"
                                icon={<Phone className="h-4 w-4 text-blue-400" />}
                            />
                            <ActivityItem
                                title="Email Sent"
                                desc="Follow-up email sent to info@techcorp.com"
                                time="1h ago"
                                icon={<Mail className="h-4 w-4 text-yellow-400" />}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
    return (
        <Card className="bg-card/50 backdrop-blur-sm border-slate-800/50 hover:bg-card/80 transition-colors cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    {change}
                </p>
            </CardContent>
        </Card>
    )
}

function AgentRow({ name, role, status, avatarColor, channels, activity }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer border border-transparent hover:border-border/50">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
                        {name[0]}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {status === 'active' && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />}
                </div>
                <div>
                    <h4 className="font-semibold text-sm">{name}</h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
                <div className="flex gap-1 mb-1">
                    {channels.map((c: string) => (
                        <div key={c} className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase text-muted-foreground font-medium">
                            {c}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    {activity}
                </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    )
}

function ActivityItem({ title, desc, time, icon }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="rounded-full bg-muted p-2 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{title}</p>
                <p className="text-sm text-muted-foreground">
                    {desc}
                </p>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
                {time}
            </div>
        </div>
    )
}
