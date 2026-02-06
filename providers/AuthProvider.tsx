import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('[Auth] Initial session:', s ? 'found' : 'none');
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log('[Auth] State changed:', _event);
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return data;
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: SignInParams) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signUp: signUpMutation.mutateAsync,
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    signUpLoading: signUpMutation.isPending,
    signInLoading: signInMutation.isPending,
    signOutLoading: signOutMutation.isPending,
    signUpError: signUpMutation.error,
    signInError: signInMutation.error,
  };
});
