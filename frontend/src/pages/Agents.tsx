import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Plus, Search, Settings, Phone, MessageSquare, Mail, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Agent, type EmployeeType } from '../lib/api';

const AVATAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500'];

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [agentsData, typesData] = await Promise.all([
                api.agents.list(),
                api.employeeTypes.list(),
            ]);
            setAgents(agentsData);
            setEmployeeTypes(typesData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleChannel(agentId: string, channel: string, currentlyEnabled: boolean) {
        try {
            await api.agents.updateChannel(agentId, { channel, is_enabled: !currentlyEnabled });
            await loadData();
            if (selectedAgent) {
                const updated = await api.agents.get(agentId);
                setSelectedAgent(updated);
            }
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleUpdateStatus(agentId: string, newStatus: 'active' | 'paused') {
        try {
            await api.agents.update(agentId, { status: newStatus });
            await loadData();
            setSelectedAgent(null);
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleSaveAgent(agentId: string, name: string, systemPrompt: string) {
        try {
            await api.agents.update(agentId, { name, custom_system_prompt: systemPrompt });
            await loadData();
            setSelectedAgent(null);
        } catch (err: any) {
            alert(err.message);
        }
    }

    return (
        <div className="relative h-full flex flex-col p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
                    <p className="text-muted-foreground">Manage your AI workforce and their capabilities.</p>
                </div>
                <Button disabled>
                    <Plus className="mr-2 h-4 w-4" /> Deploy New Agent
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search agents..." className="pl-9" />
                </div>
            </div>

            {/* Agents Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : agents.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No agents deployed yet.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent, i) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            avatarColor={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                            onClick={() => setSelectedAgent(agent)}
                        />
                    ))}
                </div>
            )}

            {/* Slide-out Config Panel */}
            <AnimatePresence>
                {selectedAgent && (
                    <AgentConfigPanel
                        agent={selectedAgent}
                        onClose={() => setSelectedAgent(null)}
                        onToggleChannel={handleToggleChannel}
                        onUpdateStatus={handleUpdateStatus}
                        onSave={handleSaveAgent}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AgentCard({ agent, avatarColor, onClick }: { agent: Agent; avatarColor: string; onClick: () => void }) {
    const enabledChannels = agent.agent_channels?.filter(c => c.is_enabled).map(c => c.channel) ?? [];
    return (
        <Card onClick={onClick} className="group cursor-pointer hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm border-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Badge variant={agent.status === 'active' ? 'success' : 'warning'}>
                    {agent.status}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center py-4 text-center">
                    <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform`}>
                        {agent.name[0]}
                    </div>
                    <h3 className="text-xl font-bold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{agent.employee_types?.name ?? 'Agent'}</p>

                    <div className="flex gap-2">
                        {enabledChannels.map((c) => (
                            <div key={c} className="bg-muted p-1.5 rounded-md text-muted-foreground">
                                {c === 'voice' && <Phone className="h-3 w-3" />}
                                {c === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                                {c === 'email' && <Mail className="h-3 w-3" />}
                                {c === 'web' && <MessageSquare className="h-3 w-3" />}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AgentConfigPanel({
    agent,
    onClose,
    onToggleChannel,
    onUpdateStatus,
    onSave,
}: {
    agent: Agent;
    onClose: () => void;
    onToggleChannel: (agentId: string, channel: string, enabled: boolean) => void;
    onUpdateStatus: (agentId: string, status: 'active' | 'paused') => void;
    onSave: (agentId: string, name: string, systemPrompt: string) => void;
}) {
    const [name, setName] = useState(agent.name);
    const [systemPrompt, setSystemPrompt] = useState(agent.custom_system_prompt ?? '');

    const channelMap = new Map(agent.agent_channels?.map(c => [c.channel, c.is_enabled]) ?? []);

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl overflow-y-auto"
            >
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Configure Agent</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 py-4 border-b border-border">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white">
                            {agent.name[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{agent.name}</h3>
                            <p className="text-muted-foreground">{agent.employee_types?.name ?? 'Agent'}</p>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    {/* Status Toggle */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20">
                            <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="flex-1 font-medium capitalize">{agent.status}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(agent.id, agent.status === 'active' ? 'paused' : 'active')}
                            >
                                {agent.status === 'active' ? 'Pause' : 'Activate'}
                            </Button>
                        </div>
                    </div>

                    {/* Channels */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Active Channels</label>
                        <div className="grid gap-2">
                            <ChannelToggle
                                icon={<Phone className="h-4 w-4" />}
                                label="Voice Telephony"
                                active={channelMap.get('voice') ?? false}
                                onToggle={() => onToggleChannel(agent.id, 'voice', channelMap.get('voice') ?? false)}
                            />
                            <ChannelToggle
                                icon={<MessageSquare className="h-4 w-4" />}
                                label="WhatsApp Business"
                                active={channelMap.get('whatsapp') ?? false}
                                onToggle={() => onToggleChannel(agent.id, 'whatsapp', channelMap.get('whatsapp') ?? false)}
                            />
                            <ChannelToggle
                                icon={<Mail className="h-4 w-4" />}
                                label="Email Support"
                                active={channelMap.get('email') ?? false}
                                onToggle={() => onToggleChannel(agent.id, 'email', channelMap.get('email') ?? false)}
                            />
                        </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">System Instructions</label>
                        <textarea
                            className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder={`You are ${agent.name}, a helpful AI assistant...`}
                        />
                    </div>

                    <div className="pt-4 flex gap-2">
                        <Button onClick={() => onSave(agent.id, name, systemPrompt)} className="w-full">
                            Save Changes
                        </Button>
                        <Button variant="outline" className="w-full" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

function ChannelToggle({ icon, label, active, onToggle }: { icon: React.ReactNode; label: string; active: boolean; onToggle: () => void }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-md border ${active ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center gap-3">
                <div className={`rounded-full p-1.5 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <button
                onClick={onToggle}
                className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-primary' : 'bg-muted'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}
