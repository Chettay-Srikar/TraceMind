import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Auth } from './pages/Auth';
import { PageContainer } from './components/layout/PageContainer';
import { CommandCenter } from './pages/CommandCenter';
import { Logs } from './pages/Logs';
import { Incidents } from './pages/Incidents';
import { IncidentDetails } from './pages/IncidentDetails';
import { Metrics } from './pages/Metrics';
import { Services } from './pages/Services';
import { Deployments } from './pages/Deployments';
import { Recommendations } from './pages/Recommendations';
import { Providers } from './pages/Providers';
import { AIAnalysis } from './pages/AIAnalysis';
import { CursorEffect } from './components/common/CursorEffect';
import { LandingPage } from './pages/LandingPage';

// Placeholder for other pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex h-full items-center justify-center text-slate-500 text-xl font-medium animate-in fade-in">
    {title} - Coming Soon
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CursorEffect />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<PageContainer />}>
              <Route index element={<CommandCenter />} />
              
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetails />} />
              <Route path="incidents/timeline" element={<PlaceholderPage title="Incident Timeline" />} />
              
              <Route path="logs" element={<Logs />} />
              <Route path="metrics" element={<Metrics />} />
              <Route path="services" element={<Services />} />
              <Route path="infrastructure" element={<PlaceholderPage title="Infrastructure" />} />
              <Route path="databases" element={<PlaceholderPage title="Databases" />} />
              
              <Route path="deployments" element={<Deployments />} />
              
              <Route path="analysis" element={<AIAnalysis />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="research" element={<PlaceholderPage title="Solution Intelligence" />} />
              
              <Route path="providers" element={<Providers />} />
              
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
