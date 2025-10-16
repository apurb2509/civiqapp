import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch the initial unread count
  const fetchUnreadCount = async (currentSession) => {
    if (!currentSession) return;
    try {
      // This is a placeholder for a more efficient summary endpoint we can build later
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentSession.user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      setUnreadCount(data ? data.length : 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
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
        fetchUnreadCount(session); // Fetch count on login
      } else {
        setProfile(null);
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
  
  // Real-time listener for new notifications
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setUnreadCount(prevCount => prevCount + 1);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [user]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    session,
    user,
    profile,
    unreadCount, // Provide count to the app
    setUnreadCount, // Provide a way to update the count
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