'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/cities')
    router.refresh()
  }

  const isAdmin = user && (!ADMIN_USER_ID || user.id === ADMIN_USER_ID)

  return (
    <nav className="border-b border-gray-100 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/cities" className="font-semibold tracking-tight text-gray-900">
          PitchD
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/cities/add" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                + Add city
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  Admin
                </Link>
              )}
              <span className="text-sm text-gray-400 hidden sm:block">
                {user.user_metadata?.username ?? user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
