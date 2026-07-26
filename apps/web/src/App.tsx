import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import CustomSignIn from './pages/CustomSignIn';
import CustomSignUp from './pages/CustomSignUp';
import Dashboard from './pages/Dashboard';
import CodeStoryViewer from './pages/CodeStoryViewer';
import ArchitectMode from './pages/ArchitectMode';
import ArchitectureReplay from './pages/ArchitectureReplay';
import SemanticSearch from './pages/SemanticSearch';
import EngineeringMentor from './pages/EngineeringMentor';
import HealthDashboard from './pages/HealthDashboard';
import ContributionFinder from './pages/ContributionFinder';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    return (
      <div className="p-8 text-red-500">
        Missing VITE_CLERK_PUBLISHABLE_KEY. Please check your .env file.
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <div className="ambient-bg"></div>
      <BrowserRouter>
        <AnimatePresence mode="wait">
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

            <Route path="/sign-up/*" element={
              <>
                <SignedOut>
                  <CustomSignUp />
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
        </AnimatePresence>
      </BrowserRouter>
    </ClerkProvider>
  );
}
