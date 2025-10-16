import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newReportCount, setNewReportCount] = useState(0);

  // This function fetches the initial counts for both users and admins
  const fetchSummary = async (currentSession) => {
    if (!currentSession) return;
    try {
      const response = await fetch('http://localhost:8080/api/notifications/summary', {
        headers: { 'Authorization': `Bearer ${currentSession.access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUnreadCount(data.unreadCount);
        setNewReportCount(data.newReportCount);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  useEffect(() => {
    const setData = async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
        fetchSummary(session); // Fetch counts on login/refresh
      } else {
        setProfile(null);
        setUnreadCount(0);
        setNewReportCount(0);
      }
      setLoading(false);
    };

    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      await setData(data.session);
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setData(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Real-time listener using Supabase Broadcast
  useEffect(() => {
    if (!user) return;

    // Listen for personal notifications (status updates, messages)
    const userChannel = supabase.channel(`notifications:${user.id}`);
    userChannel.on('broadcast', { event: 'new_notification' }, () => {
      setUnreadCount(prev => prev + 1);
    }).subscribe();
    
    // If the user is an admin, also listen for new report submissions
    let adminChannel;
    if (profile?.role === 'admin') {
      adminChannel = supabase.channel('reports');
      adminChannel.on('broadcast', { event: 'new_report' }, () => {
        setNewReportCount(prev => prev + 1);
      }).subscribe();
    }
    
    return () => {
      supabase.removeChannel(userChannel);
      if (adminChannel) {
        supabase.removeChannel(adminChannel);
      }
    };
  }, [user, profile]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    session,
    user,
    profile,
    unreadCount,
    setUnreadCount,
    newReportCount,
    setNewReportCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}