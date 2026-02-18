import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Plus, Search, Settings, Phone, MessageSquare, Mail, X, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const AGENTS = [
    { id: 1, name: 'Amara', role: 'Receptionist', status: 'active', channels: ['voice', 'whatsapp'], avatarColor: 'bg-primary' },
    { id: 2, name: 'Tunde', role: 'Sales Support', status: 'paused', channels: ['email', 'chat'], avatarColor: 'bg-secondary' },
    { id: 3, name: 'Grace', role: 'Customer Service', status: 'active', channels: ['chat'], avatarColor: 'bg-blue-500' },
];

export default function AgentsPage() {
    const [selectedAgent, setSelectedAgent] = useState<any>(null);

    return (
        <div className="relative h-full flex flex-col p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
                    <p className="text-muted-foreground">Manage your AI workforce and their capabilities.</p>
                </div>
                <Button onClick={() => setSelectedAgent({ name: 'New Agent', role: 'Unassigned', status: 'draft', channels: [] })}>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {AGENTS.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
                ))}
            </div>

            {/* Slide-out Config Panel */}
            <AnimatePresence>
                {selectedAgent && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAgent(null)}
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
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4 py-4 border-b border-border">
                                    <div className={`w-16 h-16 rounded-full ${selectedAgent.avatarColor || 'bg-slate-700'} flex items-center justify-center text-2xl font-bold text-white`}>
                                        {selectedAgent.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{selectedAgent.name}</h3>
                                        <p className="text-muted-foreground">{selectedAgent.role}</p>
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20">
                                        <div className={`w-2 h-2 rounded-full ${selectedAgent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <span className="flex-1 font-medium capitalize">{selectedAgent.status}</span>
                                        <Button variant="outline" size="sm">
                                            {selectedAgent.status === 'active' ? 'Pause' : 'Activate'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Channels */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Active Channels</label>
                                    <div className="grid gap-2">
                                        <ChannelToggle icon={<Phone className="h-4 w-4" />} label="Voice Telephony" active={selectedAgent.channels?.includes('voice')} />
                                        <ChannelToggle icon={<MessageSquare className="h-4 w-4" />} label="WhatsApp Business" active={selectedAgent.channels?.includes('whatsapp')} />
                                        <ChannelToggle icon={<Mail className="h-4 w-4" />} label="Email Support" active={selectedAgent.channels?.includes('email')} />
                                    </div>
                                </div>

                                {/* System Prompt */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">System Instructions</label>
                                    <textarea
                                        className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        defaultValue={`You are ${selectedAgent.name}, a helpful AI assistant for Mesa AI...`}
                                    />
                                </div>

                                {/* Voice Settings */}
                                <div className="space-y-3 border-t border-border pt-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Volume2 className="h-4 w-4 text-primary" /> Voice Settings
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="justify-start">Warning (Deep)</Button>
                                        <Button variant="outline" className="justify-start border-primary/50 bg-primary/10">Soft (Polite)</Button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <Button className="w-full">Save Changes</Button>
                                    <Button variant="outline" className="w-full">Test Chat</Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function AgentCard({ agent, onClick }: any) {
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
                    <div className={`w-20 h-20 rounded-full ${agent.avatarColor} flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform`}>
                        {agent.name[0]}
                    </div>
                    <h3 className="text-xl font-bold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{agent.role}</p>

                    <div className="flex gap-2">
                        {agent.channels.map((c: string) => (
                            <div key={c} className="bg-muted p-1.5 rounded-md text-muted-foreground">
                                {c === 'voice' && <Phone className="h-3 w-3" />}
                                {c === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                                {c === 'email' && <Mail className="h-3 w-3" />}
                                {c === 'chat' && <MessageSquare className="h-3 w-3" />}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ChannelToggle({ icon, label, active }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-md border ${active ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center gap-3">
                <div className={`rounded-full p-1.5 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    )
}
