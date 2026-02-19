import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/Auth';
import LandingPage from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/Agents';
import InboxPage from './pages/Inbox';
import LeadsPage from './pages/Leads';
import IntegrationsPage from './pages/Integrations';
import Capabilities from './pages/Capabilities';
import Solutions from './pages/Solutions';
import Pricing from './pages/Pricing';

const Bookings = () => <div className="p-8 text-white"><h1 className="text-3xl font-bold mb-4">Bookings</h1></div>;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#020817]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    return isAuthenticated ? <Navigate to="/app" replace /> : <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route index element={<LandingPage />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/pricing" element={<Pricing />} />

            <Route path="/auth" element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
