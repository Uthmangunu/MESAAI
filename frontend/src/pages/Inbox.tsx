import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Phone, MessageSquare, Mail, MoreVertical, Send, Paperclip, Mic } from 'lucide-react';

const CONVERSATIONS = [
    { id: 1, name: 'John Doe', lastMsg: 'Can I book for tomorrow?', time: '2m', channel: 'whatsapp', unread: 2, avatarColor: 'bg-emerald-500' },
    { id: 2, name: '+234 812 345...', lastMsg: 'Missed call', time: '15m', channel: 'voice', unread: 0, avatarColor: 'bg-blue-500' },
    { id: 3, name: 'Sarah James', lastMsg: 'Thanks for the info!', time: '1h', channel: 'email', unread: 0, avatarColor: 'bg-purple-500' },
    { id: 4, name: 'Tech Solutions', lastMsg: 'Invoice received.', time: '3h', channel: 'email', unread: 0, avatarColor: 'bg-orange-500' },
];

const MESSAGES = [
    { id: 1, sender: 'John Doe', text: 'Hi, are you open tomorrow?', time: '10:00 AM', isMe: false },
    { id: 2, sender: 'Amara', text: 'Yes, we are open from 9 AM to 5 PM. Would you like to book an appointment?', time: '10:01 AM', isMe: true },
    { id: 3, sender: 'John Doe', text: 'Can I book for tomorrow at 2 PM?', time: '10:02 AM', isMe: false },
];

export default function InboxPage() {
    const [selectedChat, setSelectedChat] = useState(CONVERSATIONS[0]);

    return (
        <div className="flex h-full max-h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Sidebar List */}
            <div className="w-80 border-r border-border flex flex-col bg-card/30 backdrop-blur-sm">
                <div className="p-4 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">Inbox</h1>
                        <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages..." className="pl-9 bg-background/50" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Button variant="secondary" size="sm" className="whitespace-nowrap rounded-full">All Chats</Button>
                        <Button variant="ghost" size="sm" className="whitespace-nowrap rounded-full">Unread</Button>
                        <Button variant="ghost" size="sm" className="whitespace-nowrap rounded-full">WhatsApp</Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {CONVERSATIONS.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`flex items-start gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${selectedChat.id === chat.id ? 'bg-muted/50 border-l-2 border-l-primary' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-full ${chat.avatarColor} flex-shrink-0 flex items-center justify-center text-white font-bold`}>
                                {chat.name[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm truncate">{chat.name}</h4>
                                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                                </div>
                                <p className={`text-xs truncate ${chat.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                    {chat.lastMsg}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {chat.channel === 'whatsapp' && <MessageSquare className="h-3 w-3 text-green-500" />}
                                {chat.channel === 'voice' && <Phone className="h-3 w-3 text-blue-500" />}
                                {chat.channel === 'email' && <Mail className="h-3 w-3 text-yellow-500" />}

                                {chat.unread > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative">
                {/* Chat Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${selectedChat.avatarColor} flex items-center justify-center text-white font-bold`}>
                            {selectedChat.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                {selectedChat.name}
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase text-muted-foreground font-medium">{selectedChat.channel}</span>
                            </h3>
                            {selectedChat.channel === 'voice' ? (
                                <p className="text-xs text-red-400 flex items-center gap-1 animate-pulse">
                                    ● Recording active
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Active now via Amara</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {MESSAGES.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-4 ${msg.isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-card/30 backdrop-blur-md">
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-xl border border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary/50 transition-all">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <input
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground"
                            placeholder={`Message ${selectedChat.name}...`}
                        />
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Mic className="h-5 w-5" />
                        </Button>
                        <Button size="icon" className="rounded-lg h-9 w-9">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        Press Enter to send • Agent "Amara" is currently handling replies
                    </p>
                </div>
            </div>
        </div>
    );
}
