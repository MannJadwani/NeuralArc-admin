'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const getRedirect = () => {
    if (typeof window === 'undefined') return '/posts'
    const params = new URLSearchParams(window.location.search)
    return params.get('redirect') || '/posts'
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already signed in, redirect to target
  React.useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace(getRedirect())
      }
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError || !signInData.session) throw signInError || new Error('No session')

      // Check admin membership
      const { data: adminRow, error: adminErr } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', signInData.session.user.id)
        .single()

      if (adminErr || !adminRow) {
        setError('You do not have admin access')
        await supabase.auth.signOut()
        return
      }

      router.replace(getRedirect())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold text-white mb-4">Admin Login</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}


