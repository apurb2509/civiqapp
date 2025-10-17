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
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(userProfile);
        fetchSummary(session);
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { setData(session); });
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const userChannel = supabase.channel(`notifications:${user.id}`);
    userChannel.on('broadcast', { event: 'new_notification' }, () => {
      setUnreadCount(prev => prev + 1);
    }).subscribe();
    
    let adminChannel;
    if (profile?.role === 'admin') {
      adminChannel = supabase.channel('reports');
      adminChannel.on('broadcast', { event: 'new_report' }, () => {
        setNewReportCount(prev => prev + 1);
      }).subscribe();
    }
    
    return () => {
      supabase.removeChannel(userChannel);
      if (adminChannel) supabase.removeChannel(adminChannel);
    };
  }, [user, profile]);

  const value = {
    session, user, profile, unreadCount, newReportCount,
    setUnreadCount, setNewReportCount,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
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