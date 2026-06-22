'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getPitchComments, addPitchComment, deletePitchComment } from '@/lib/services/comments'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function PitchComments({ pitchId }) {
  const [user, setUser] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    getPitchComments(pitchId).then(c => {
      setComments(c)
      setLoading(false)
    })
  }, [pitchId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || !user) return
    setSubmitting(true)
    const { data, error } = await addPitchComment(pitchId, user.id, text.trim())
    setSubmitting(false)
    if (!error && data) {
      setComments(c => [...c, data])
      setText('')
      setExpanded(true)
    }
  }

  async function handleDelete(commentId) {
    await deletePitchComment(commentId)
    setComments(c => c.filter(x => x.id !== commentId))
  }

  const visibleComments = expanded ? comments : comments.slice(-2)

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* Comment count toggle */}
      {comments.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
        >
          {expanded
            ? 'Hide comments'
            : `${comments.length} tip${comments.length !== 1 ? 's' : ''} from buskers`}
        </button>
      )}

      {/* Comments list */}
      {expanded && !loading && (
        <div className="space-y-2 mb-3">
          {visibleComments.map(c => (
            <div key={c.id} className="flex items-start gap-2 group">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">
                    {c.profiles?.display_name ?? 'Busker'}
                  </span>
                  <span className="text-xs text-gray-300">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{c.comment}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors text-xs mt-2 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={280}
            placeholder="Add a tip for other buskers…"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="text-xs bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Post
          </button>
        </form>
      ) : (
        comments.length === 0 && !loading ? (
          <p className="text-xs text-gray-300">
            <a href="/auth/login" className="hover:text-gray-500 transition-colors">Sign in</a> to leave a tip
          </p>
        ) : null
      )}
    </div>
  )
}
