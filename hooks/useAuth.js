import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

// Her rolün hangi admin sayfalarına erişebileceği
export const ROLE_PERMISSIONS = {
  superadmin: {
    pages: ['*'], // her şey
    canManageUsers: true,
    canManageRoles: true,
    canManageSettings: true,
    canManagePermissions: true,
    canDeleteAny: true,
    canPublishAny: true,
  },
  admin: {
    pages: ['dashboard', 'homepage', 'dishes', 'restaurants', 'cities', 'chefs', 'articles', 'users', 'settings'],
    canManageUsers: true,
    canManageRoles: false, // superadmin rolü atayamaz
    canManageSettings: true,
    canManagePermissions: false,
    canDeleteAny: true,
    canPublishAny: true,
  },
  editor: {
    pages: ['dashboard', 'articles', 'dishes', 'restaurants', 'chefs'],
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canManagePermissions: false,
    canDeleteAny: false,
    canPublishAny: true, // içerik onaylayabilir
  },
  author: {
    pages: ['dashboard', 'articles'], // sadece kendi makaleleri
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canManagePermissions: false,
    canDeleteAny: false,
    canPublishAny: false, // kendi makalelerini taslak kaydedebilir, onay gerekir
  },
  moderator: {
    pages: ['dashboard'], // ileride yorum/review moderasyon sayfaları eklenince buraya
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canManagePermissions: false,
    canDeleteAny: false,
    canPublishAny: false,
  },
  user: {
    pages: [],
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false,
    canManagePermissions: false,
    canDeleteAny: false,
    canPublishAny: false,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    supabase.auth.getSession().then(function ({ data }) {
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

    const { data } = supabase.auth.onAuthStateChange(function (event, session) {
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

    return function () { data.subscription.unsubscribe(); };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profil yoksa oluştur
        if (error.code === 'PGRST116' || error.code === 'PGRST301' || error.message?.includes('0 rows')) {
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

  async function createProfile(authUser) {
    const username = authUser.user_metadata?.username
      || authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || '',
        username,
        role: 'user',
        is_active: true,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (data) setProfile(data);
    if (error) console.error('createProfile error:', error);
  }

  function signIn(identifier, password) {
    return new Promise(function (resolve, reject) {
      const isEmail = identifier.includes('@');
      if (!isEmail) {
        supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.toLowerCase())
          .maybeSingle()
          .then(function ({ data, error }) {
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
      .then(function ({ error }) {
        if (error) reject(error);
        else resolve();
      });
  }

  async function signUp(email, password, fullName, username) {
    // 1. Kullanıcı adı müsait mi kontrol et
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existing) throw new Error('Bu kullanıcı adı zaten kullanılıyor');

    // 2. Auth kaydı yap
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.toLowerCase(),
        },
      },
    });

    if (authError) throw authError;

    // 3. E-posta doğrulama aktifse profil trigger'a bırakılır
    // Aktif değilse (geliştirme ortamı) manuel profil oluştur
    if (authData.user && !authData.user.email_confirmed_at) {
      // Doğrulama e-postası gönderildi, profil onay sonrası oluşacak
      return authData;
    }

    // Anında aktif olan kullanıcılar için profil oluştur
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        username: username.toLowerCase(),
        role: 'user',
        is_active: true,
      }, { onConflict: 'id' });
    }

    return authData;
  }

  function signOut() {
    return supabase.auth.signOut().then(function () {
      setUser(null);
      setProfile(null);
    });
  }

  // Rol helpers
  const role = profile?.role || 'user';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = ['superadmin', 'admin'].includes(role);
  const isEditor = ['superadmin', 'admin', 'editor'].includes(role);
  const isAuthor = ['superadmin', 'admin', 'editor', 'author'].includes(role);
  const isModerator = ['superadmin', 'admin', 'moderator'].includes(role);
  const isStaff = ['superadmin', 'admin', 'editor', 'author', 'moderator'].includes(role);

  function canAccessAdminPage(pageKey) {
    if (!isStaff) return false;
    if (permissions.pages.includes('*')) return true;
    return permissions.pages.includes(pageKey);
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut,
      role, permissions,
      isSuperAdmin, isAdmin, isEditor, isAuthor, isModerator, isStaff,
      canAccessAdminPage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}