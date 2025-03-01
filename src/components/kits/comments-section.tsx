"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Comment, addComment, getComments, toggleCommentLike } from "@/utils/supabase/kit-interactions"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface CommentsProps {
  kitId: string
  user: any | null | undefined
  isLoading: boolean
}

export function CommentsSection({ kitId, user, isLoading }: CommentsProps) {
  const [comment, setComment] = useState("")
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  console.log('test',user)
  // Query for comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', kitId],
    queryFn: () => getComments(kitId),
  })

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: ({ kitId, content }: { kitId: string, content: string }) =>
      addComment(kitId, content),
    onSuccess: () => {
      setComment("") // Clear the input
      queryClient.invalidateQueries({ queryKey: ['comments', kitId] }) // Trigger refetch
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully."
      })
    },
    onError: (error) => {
      console.error("Error posting comment:", error)
      toast({
        title: "Error posting comment",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  })

  // Mutation for liking comments
  const toggleLikeMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', kitId] })
    },
    onError: (error) => {
      console.error("Error toggling like:", error)
      toast({
        title: "Error updating like",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  })

  // Subscribe to new comments
  useEffect(() => {
    const channel = supabase
      .channel('comments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `kit_id=eq.${kitId}`
      }, () => {
        // Invalidate and refetch comments
        queryClient.invalidateQueries({ queryKey: ['comments', kitId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kitId, supabase, queryClient])

  const handleSubmitComment = async () => {
    if (!comment.trim()) return

    addCommentMutation.mutate({ kitId, content: comment })
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

    toggleLikeMutation.mutate(commentId)
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center p-4 border rounded-lg bg-muted">
            Loading...
          </div>
        ) : user ? (
          <div className="border rounded-lg p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full min-h-[100px] p-2 border rounded-md mb-2"
              disabled={addCommentMutation.isPending}
            />
            
            <Button
              onClick={handleSubmitComment}
              disabled={addCommentMutation.isPending || !comment.trim()}
            >
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
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
                disabled={!user || toggleLikeMutation.isPending}
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