

export const mockApi = {
    getStats: () => ({
        totalMessages: { value: "3,482", change: "+12.5%", trend: "up" },
        activeBookings: { value: "28", change: "+4", trend: "up" },
        leadsCaptured: { value: "156", change: "+18%", trend: "up" },
        avgResponseTime: { value: "0.8s", change: "-15%", trend: "down-good" },
    }),

    getAgents: () => [
        {
            id: 1,
            name: "Amara",
            role: "Receptionist",
            status: "active",
            avatarColor: "bg-gradient-to-br from-primary to-teal-600",
            channels: ['whatsapp', 'voice'],
            activity: "On a call with +234 80...",
            initial: "A"
        },
        {
            id: 2,
            name: "Tunde",
            role: "Sales Support",
            status: "paused",
            avatarColor: "bg-gradient-to-br from-secondary to-purple-600",
            channels: ['email', 'chat'],
            activity: "Paused by admin",
            initial: "T"
        },
        {
            id: 3,
            name: "Grace",
            role: "Customer Service",
            status: "active",
            avatarColor: "bg-gradient-to-br from-blue-500 to-blue-700",
            channels: ['chat'],
            activity: "Typing reply to Support #442...",
            initial: "G"
        },
        {
            id: 4,
            name: "David",
            role: "Technical Lead",
            status: "active",
            avatarColor: "bg-gradient-to-br from-orange-400 to-red-500",
            channels: ['email', 'voice'],
            activity: "Processing ticket #9921",
            initial: "D"
        }
    ],

    getActivityFeed: () => [
        {
            id: 1,
            title: "New Booking Confirmed",
            desc: "Amara booked an appointment for tomorrow at 2:00 PM.",
            time: "2m ago",
            type: "booking",
            icon: "Calendar",
            bg: "bg-primary"
        },
        {
            id: 2,
            title: "Lead Captured",
            desc: "Tunde collected contact info from Sarah J.",
            time: "15m ago",
            type: "lead",
            icon: "Users",
            bg: "bg-secondary"
        },
        {
            id: 3,
            title: "Voice Call Completed",
            desc: "Incoming call from +234 812...",
            time: "42m ago",
            type: "call",
            icon: "Phone",
            bg: "bg-blue-500"
        },
        {
            id: 4,
            title: "Email Sent",
            desc: "Follow-up to info@techcorp.com",
            time: "1h ago",
            type: "email",
            icon: "Mail",
            bg: "bg-yellow-400"
        },
        {
            id: 5,
            title: "System Update",
            desc: "Agent 'Grace' knowledge base updated.",
            time: "2h ago",
            type: "system",
            icon: "Activity",
            bg: "bg-slate-500"
        }
    ]
};
