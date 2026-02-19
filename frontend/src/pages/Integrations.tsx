import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, XCircle, ExternalLink, Facebook, Instagram, FileSpreadsheet } from 'lucide-react';

export default function Integrations() {
    const [integrations, setIntegrations] = React.useState([
        {
            id: 'facebook',
            name: 'Facebook Messenger',
            description: 'Connect your Facebook Page to receive messages',
            icon: Facebook,
            connected: false,
            setupUrl: 'https://developers.facebook.com/apps',
        },
        {
            id: 'instagram',
            name: 'Instagram DMs',
            description: 'Connect your Instagram Business account for DM handling',
            icon: Instagram,
            connected: false,
            setupUrl: 'https://developers.facebook.com/apps',
        },
        {
            id: 'google_sheets',
            name: 'Google Sheets',
            description: 'Export leads automatically to Google Sheets',
            icon: FileSpreadsheet,
            connected: false,
            setupUrl: '#',
        },
    ]);

    function handleConnect(integrationId: string) {
        // In production, this would initiate OAuth flow
        console.log(`Connecting ${integrationId}...`);

        // For demo, just toggle state
        setIntegrations((prev) =>
            prev.map((int) =>
                int.id === integrationId ? { ...int, connected: !int.connected } : int
            )
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1 font-heading">
                        Integrations
                    </h1>
                    <p className="text-muted-foreground">
                        Connect your tools and platforms
                    </p>
                </div>
            </div>

            {/* Integration Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => {
                    const Icon = integration.icon;
                    return (
                        <Card
                            key={integration.id}
                            className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <CardHeader className="border-b border-border/40 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Icon size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-white">
                                                {integration.name}
                                            </CardTitle>
                                            <Badge
                                                variant={integration.connected ? 'success' : 'secondary'}
                                                className="mt-1"
                                            >
                                                {integration.connected ? (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 size={12} />
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <XCircle size={12} />
                                                        Not Connected
                                                    </span>
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <CardDescription className="text-sm text-muted-foreground">
                                    {integration.description}
                                </CardDescription>

                                <div className="flex gap-2">
                                    {integration.connected ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleConnect(integration.id)}
                                                className="flex-1"
                                            >
                                                Disconnect
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => console.log('Test connection')}
                                            >
                                                Test
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => handleConnect(integration.id)}
                                            className="flex-1"
                                        >
                                            Connect
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(integration.setupUrl, '_blank')}
                                    >
                                        <ExternalLink size={16} />
                                    </Button>
                                </div>

                                {integration.connected && (
                                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                        <p className="text-xs text-green-400">
                                            ✓ Integration active and receiving data
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Setup Instructions */}
            <Card className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg">
                <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg font-semibold text-white">
                        Setup Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <Facebook size={18} className="text-primary" />
                            Facebook Messenger Setup
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                            <li>Go to Meta for Developers and create a new app</li>
                            <li>Add the Messenger product to your app</li>
                            <li>
                                Generate a Page Access Token for your Facebook Page
                            </li>
                            <li>
                                Set webhook URL to: <code className="bg-secondary px-1 py-0.5 rounded text-xs">https://api.mesaai.com/api/webhooks/facebook</code>
                            </li>
                            <li>Subscribe to <code className="bg-secondary px-1 py-0.5 rounded text-xs">messages</code> webhook events</li>
                            <li>Click "Connect" above to link your page</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <Instagram size={18} className="text-primary" />
                            Instagram DMs Setup
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                            <li>Ensure your Instagram account is a Business account</li>
                            <li>Connect it to your Facebook Page</li>
                            <li>In Meta for Developers, add Instagram product</li>
                            <li>
                                Set webhook URL to: <code className="bg-secondary px-1 py-0.5 rounded text-xs">https://api.mesaai.com/api/webhooks/instagram</code>
                            </li>
                            <li>Subscribe to <code className="bg-secondary px-1 py-0.5 rounded text-xs">messages</code> webhook events</li>
                            <li>Click "Connect" above to authorize</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <FileSpreadsheet size={18} className="text-primary" />
                            Google Sheets Setup
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                            <li>Click "Connect" to authorize Google Sheets access</li>
                            <li>Select the spreadsheet where leads should be exported</li>
                            <li>Mesa AI will automatically append new leads to your sheet</li>
                            <li>Leads include: Name, Email, Phone, Service Type, Score, and more</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>

            {/* Webhook Endpoints */}
            <Card className="bg-card/30 backdrop-blur-xl border-border/60 shadow-lg">
                <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg font-semibold text-white">
                        Webhook Endpoints
                    </CardTitle>
                    <CardDescription>
                        Use these URLs when configuring webhooks in external platforms
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                            <div>
                                <div className="text-sm font-medium text-white">Facebook Messenger</div>
                                <code className="text-xs text-muted-foreground">
                                    https://api.mesaai.com/api/webhooks/facebook
                                </code>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        'https://api.mesaai.com/api/webhooks/facebook'
                                    )
                                }
                            >
                                Copy
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                            <div>
                                <div className="text-sm font-medium text-white">Instagram</div>
                                <code className="text-xs text-muted-foreground">
                                    https://api.mesaai.com/api/webhooks/instagram
                                </code>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        'https://api.mesaai.com/api/webhooks/instagram'
                                    )
                                }
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
