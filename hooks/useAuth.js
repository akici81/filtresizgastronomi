import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    supabase.auth.getSession().then(function({ data }) {
      const session = data.session;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return function() { data.subscription.unsubscribe(); };
  }, []);

  async function fetchProfile(userId) {
    try {
      // Önce auth session'ın hazır olmasını bekle
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        // 403 alınca profili manuel oluşturmayı dene
        if (error.code === 'PGRST301' || error.message.includes('403')) {
          await createProfile(sessionData.session.user);
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('fetchProfile exception:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(user) {
    // Profil yoksa oluştur
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || user.email.split('@')[0],
        role: 'user',
        is_active: true,
      })
      .select()
      .single();

    if (data) setProfile(data);
  }

  function signIn(identifier, password) {
    return new Promise(function(resolve, reject) {
      if (!identifier.includes('@')) {
        supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.toLowerCase())
          .single()
          .then(function({ data, error }) {
            if (error || !data) {
              reject(new Error('Kullanıcı bulunamadı'));
              return;
            }
            doSignIn(data.email, password, resolve, reject);
          });
      } else {
        doSignIn(identifier, password, resolve, reject);
      }
    });
  }

  function doSignIn(email, password, resolve, reject) {
    supabase.auth.signInWithPassword({ email, password })
      .then(function({ error }) {
        if (error) reject(error);
        else resolve();
      });
  }

  function signUp(email, password, fullName, username) {
    return new Promise(function(resolve, reject) {
      supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single()
        .then(function({ data }) {
          if (data) {
            reject(new Error('Bu kullanıcı adı zaten kullanılıyor'));
            return;
          }
          supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, username: username.toLowerCase() } },
          }).then(function({ error }) {
            if (error) reject(error);
            else resolve();
          });
        });
    });
  }

  function signOut() {
    return supabase.auth.signOut().then(function() {
      setUser(null);
      setProfile(null);
    });
  }

  // Role helpers
  const role = profile?.role;
  const isAdmin = ['superadmin', 'admin'].includes(role);
  const isEditor = ['superadmin', 'admin', 'editor'].includes(role);
  const isAuthor = ['superadmin', 'admin', 'editor', 'author'].includes(role);
  const isModerator = ['superadmin', 'admin', 'moderator'].includes(role);

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut,
      isAdmin, isEditor, isAuthor, isModerator,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}