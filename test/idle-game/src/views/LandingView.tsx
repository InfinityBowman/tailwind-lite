/**
 * LandingView - Public landing page for unauthenticated users
 *
 * Shows the AI Co-op landing page. Redirects to /play if user has a session.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { AILandingPage } from '../components/aiCoop';
import { LoginDialog } from '../components/auth/LoginDialog';

const LandingView: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  // Redirect to game if user is authenticated
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate({ to: '/play/farming/$subSection', params: { subSection: 'planets' } });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  // Show loading state while checking auth
  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Show landing page
  return (
    <>
      <AILandingPage
        onStartPlaying={() => setLoginOpen(true)}
        onConnectAI={() => setLoginOpen(true)}
      />
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLoginDiscord={() => {
          setLoginOpen(false);
          auth.loginWithDiscord();
        }}
        onLoginGoogle={() => {
          setLoginOpen(false);
          auth.loginWithGoogle();
        }}
        onLoginAnonymous={() => {
          setLoginOpen(false);
          auth.loginAnonymously();
        }}
      />
    </>
  );
};

export default LandingView;
