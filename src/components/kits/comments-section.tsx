"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Comment, addComment, getComments, toggleCommentLike } from "@/utils/supabase/kit-interactions"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

interface CommentsProps {
  kitId: string
}

export function CommentsSection({ kitId }: CommentsProps) {
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLike, setIsLoadingLike] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    // Load comments
    const loadComments = async () => {
      try {
        const comments = await getComments(kitId)
        setComments(comments)
      } catch (error) {
        console.error("Error loading comments:", error)
        toast({
          title: "Error loading comments",
          description: "Please try again later.",
          variant: "destructive"
        })
      }
    }

    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    loadComments()
    getUser()

    // Subscribe to new comments
    const channel = supabase
      .channel('comments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `kit_id=eq.${kitId}`
      }, async payload => {
        // Fetch the complete comment data including user profile
        const comments = await getComments(kitId)
        const newComment = comments.find(c => c.id === payload.new.id)
        if (newComment) {
          setComments(prev => [newComment, ...prev])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kitId, supabase, toast])

  const handleSubmitComment = async () => {
    if (!comment.trim()) return

    setIsLoading(true)
    try {
      const newComment = await addComment(kitId, comment)
      // Let the subscription handle adding the comment
      setComment("")
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully."
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error posting comment",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like comments.",
        variant: "destructive"
      })
      return
    }

    setIsLoadingLike(commentId)
    try {
      const isLiked = await toggleCommentLike(commentId)
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes_count: isLiked 
              ? comment.likes_count + 1 
              : comment.likes_count - 1,
            user_has_liked: isLiked
          }
        }
        return comment
      }))
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error updating like",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingLike(null)
    }
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>
      <div className="space-y-6">
        {user ? (
          <div className="border rounded-lg p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full min-h-[100px] p-2 border rounded-md mb-2"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={isLoading || !comment.trim()}
            >
              {isLoading ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        ) : (
          <div className="text-center p-4 border rounded-lg bg-muted">
            Please log in to comment
          </div>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {comment.user.avatar_url ? (
                  <img 
                    src={comment.user.avatar_url} 
                    alt={comment.user.display_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-gray-500">
                    {comment.user.display_name?.[0] ?? "?"}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium">{comment.user.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">{comment.content}</p>
            <div className="mt-2 flex items-center gap-2">
              <Button 
                variant={comment.user_has_liked ? "default" : "ghost"}
                size="sm"
                onClick={() => handleLikeComment(comment.id)}
                disabled={!user || isLoadingLike === comment.id}
              >
                ♥ {comment.likes_count}
              </Button>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  )
}