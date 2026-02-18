import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/Agents';
import InboxPage from './pages/Inbox';

const Bookings = () => <div className="p-8 text-white"><h1 className="text-3xl font-bold mb-4">Bookings</h1></div>;
const Leads = () => <div className="p-8 text-white"><h1 className="text-3xl font-bold mb-4">Leads</h1></div>;


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        {/* Main App Routes */}
        <Route path="/" element={<AppLayout />}>
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
