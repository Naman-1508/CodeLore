import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';

// Layout
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import CustomSignIn from './pages/CustomSignIn';
import Dashboard from './pages/Dashboard';
import CodeStoryViewer from './pages/CodeStoryViewer';
import ArchitectMode from './pages/ArchitectMode';
import ArchitectureReplay from './pages/ArchitectureReplay';
import WorkspaceSettings from './pages/WorkspaceSettings';
import SemanticSearch from './pages/SemanticSearch';
import EngineeringMentor from './pages/EngineeringMentor';
import HealthDashboard from './pages/HealthDashboard';
import ContributionFinder from './pages/ContributionFinder';
import Profile from './pages/Profile';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          } />
          
          <Route path="/sign-in/*" element={
            <>
              <SignedOut>
                <CustomSignIn />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          } />

          {/* Protected Routes inside AppLayout */}
          <Route path="/*" element={
            <>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
              <SignedIn>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/stories" element={<CodeStoryViewer />} />
                    <Route path="/stories/:id" element={<CodeStoryViewer />} />
                    <Route path="/architect" element={<ArchitectMode />} />
                    <Route path="/replay" element={<ArchitectureReplay />} />
                    <Route path="/search" element={<SemanticSearch />} />
                    <Route path="/mentor" element={<EngineeringMentor />} />
                    <Route path="/health" element={<HealthDashboard />} />
                    <Route path="/contributions" element={<ContributionFinder />} />
                    <Route path="/settings" element={<WorkspaceSettings />} />
                    <Route path="/profile" element={<Profile />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </SignedIn>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
