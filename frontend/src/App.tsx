import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/Auth';
import LandingPage from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/Agents';
import InboxPage from './pages/Inbox';

const Bookings = () => <div className="p-8 text-white"><h1 className="text-3xl font-bold mb-4">Bookings</h1></div>;
const Leads = () => <div className="p-8 text-white"><h1 className="text-3xl font-bold mb-4">Leads</h1></div>;


import Capabilities from './pages/Capabilities';
import Solutions from './pages/Solutions';
import Pricing from './pages/Pricing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="/capabilities" element={<Capabilities />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected App Routes */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="leads" element={<Leads />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
