import { supabase } from './supabase'

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { data, error }

  // Insert profile directly — no trigger needed
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      username: username || email.split('@')[0],
    })
  }

  return { data, error: null }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
