import React from 'react';
import { api, Lead } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Filter, Flame, Search, X } from 'lucide-react';

export default function Leads() {
    const [leads, setLeads] = React.useState<Lead[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showHotOnly, setShowHotOnly] = React.useState(false);
    const [serviceTypeFilter, setServiceTypeFilter] = React.useState<string>('all');
    const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

    React.useEffect(() => {
        loadLeads();
    }, [showHotOnly, serviceTypeFilter]);

    async function loadLeads() {
        try {
            const params: {
                is_hot?: boolean;
                service_type?: string;
                limit?: number;
            } = { limit: 100 };

            if (showHotOnly) {
                params.is_hot = true;
            }

            if (serviceTypeFilter && serviceTypeFilter !== 'all') {
                params.service_type = serviceTypeFilter;
            }

            const data = await api.leads.list(params);
            setLeads(data);
        } catch (err) {
            console.error('Failed to load leads:', err);
        } finally {
            setLoading(false);
        }
    }

    const filteredLeads = leads.filter((lead) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            lead.name?.toLowerCase().includes(query) ||
            lead.email?.toLowerCase().includes(query) ||
            lead.phone?.includes(query) ||
            lead.service_type?.toLowerCase().includes(query)
        );
    });

    const serviceTypes = [
        { value: 'all', label: 'All Services' },
        { value: 'office_cleaning', label: 'Office Cleaning' },
        { value: 'fm_support', label: 'FM Support' },
        { value: 'end_of_tenancy', label: 'End of Tenancy' },
        { value: 'airbnb', label: 'Airbnb' },
        { value: 'deep_clean', label: 'Deep Clean' },
    ];

    function getScoreColor(score: number): string {
        if (score >= 7) return 'text-red-400';
        if (score >= 5) return 'text-yellow-400';
        return 'text-gray-400';
    }

    function getUrgencyBadge(urgency: string | null) {
        if (!urgency) return null;
        const variants: Record<string, 'destructive' | 'warning' | 'default'> = {
            within_48h: 'destructive',
            within_7days: 'warning',
            within_30days: 'default',
        };
        const labels: Record<string, string> = {
            within_48h: '48h',
            within_7days: '7 days',
            within_30days: '30 days',
            flexible: 'Flexible',
        };
        return (
            <Badge variant={variants[urgency] || 'default'} className="text-xs">
                {labels[urgency] || urgency}
            </Badge>
        );
    }

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1 font-heading">
                        Leads
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and track your sales leads
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showHotOnly ? 'default' : 'outline'}
                        onClick={() => setShowHotOnly(!showHotOnly)}
                        className="gap-2"
                    >
                        <Flame size={16} />
                        HOT Leads Only
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-card/30 backdrop-blur-xl border-border/60">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                size={18}
                            />
                            <Input
                                placeholder="Search by name, email, phone, or service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Service Type Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-muted-foreground" />
                            <select
                                value={serviceTypeFilter}
                                onChange={(e) => setServiceTypeFilter(e.target.value)}
                                className="bg-secondary border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {serviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || showHotOnly || serviceTypeFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowHotOnly(false);
                                    setServiceTypeFilter('all');
                                }}
                            >
                                <X size={16} className="mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-card/30 backdrop-blur-xl border-border/60">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-white">{leads.length}</div>
                        <div className="text-xs text-muted-foreground">Total Leads</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 backdrop-blur-xl border-border/60">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-400">
                            {leads.filter((l) => l.is_hot).length}
                        </div>
                        <div className="text-xs text-muted-foreground">HOT Leads</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 backdrop-blur-xl border-border/60">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-primary">
                            {leads.filter((l) => l.status === 'new').length}
                        </div>
                        <div className="text-xs text-muted-foreground">New</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/30 backdrop-blur-xl border-border/60">
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-400">
                            {leads.filter((l) => l.status === 'converted').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Converted</div>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Table */}
            <Card className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg">
                <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg font-semibold text-white">
                        All Leads ({filteredLeads.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No leads found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Urgency
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-lg font-bold ${getScoreColor(
                                                            lead.lead_score
                                                        )}`}
                                                    >
                                                        {lead.lead_score}
                                                    </span>
                                                    {lead.is_hot && (
                                                        <Flame size={16} className="text-red-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-white">
                                                    {lead.name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    via {lead.source_channel || 'unknown'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-white">
                                                    {lead.email || lead.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className="text-xs">
                                                    {lead.service_type?.replace(/_/g, ' ') || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">{getUrgencyBadge(lead.urgency)}</td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant={
                                                        lead.status === 'converted' ? 'success' : 'default'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {lead.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lead Detail Modal (simple for now) */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedLead(null)}
                >
                    <Card
                        className="bg-card border-border max-w-2xl w-full max-h-[80vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="border-b border-border/40">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-white">
                                        {selectedLead.name || 'Lead Details'}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Score: {selectedLead.lead_score}/10
                                        {selectedLead.is_hot && ' - HOT LEAD'}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedLead(null)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-white mb-2">Contact Information</h3>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Email:</span>{' '}
                                        <span className="text-white">{selectedLead.email || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Phone:</span>{' '}
                                        <span className="text-white">{selectedLead.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-white mb-2">Service Details</h3>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Service Type:</span>{' '}
                                        <span className="text-white">
                                            {selectedLead.service_type?.replace(/_/g, ' ') || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Urgency:</span>{' '}
                                        <span className="text-white">{selectedLead.urgency || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedLead.notes && (
                                <div>
                                    <h3 className="font-semibold text-white mb-2">Notes</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLead.notes}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-white mb-2">Additional Data</h3>
                                <pre className="text-xs bg-secondary/50 p-3 rounded overflow-auto">
                                    {JSON.stringify(selectedLead.service_data, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
