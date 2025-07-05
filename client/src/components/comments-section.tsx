import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Reply, Trash2, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Comment {
  id: number;
  articleId: number;
  userId: number;
  parentId?: number;
  content: string;
  authorName: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  articleId: number;
  articleTitle: string;
}

function CommentCard({ comment, onReply, onDelete, currentUserId }: {
  comment: Comment;
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
  currentUserId?: number;
}) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{comment.authorName}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</p>
            </div>
          </div>
          {currentUserId === comment.userId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(comment.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <p className="text-sm mb-3 leading-relaxed">{comment.content}</p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            className="text-gray-500 hover:text-blue-600"
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-gray-200">
            {comment.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommentsSection({ articleId, articleTitle }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/comments/${articleId}`],
    enabled: !!articleId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { articleId: number; content: string; parentId?: number }) => {
      return apiRequest('POST', `/api/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${articleId}`] });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest('DELETE', `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${articleId}`] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    createCommentMutation.mutate({
      articleId,
      content: newComment.trim(),
    });
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyingTo || !isAuthenticated) return;

    createCommentMutation.mutate({
      articleId,
      content: replyContent.trim(),
      parentId: replyingTo,
    });
  };

  const handleReply = (parentId: number) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/profile';
      return;
    }
    setReplyingTo(parentId);
  };

  const handleDelete = (commentId: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Discussion</h3>
        <span className="text-sm text-gray-500">({comments.length} comments)</span>
      </div>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Share your thoughts on ${articleTitle}...`}
            className="mb-3"
            rows={3}
          />
          <Button
            type="submit"
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      ) : (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 mb-3">
              Please login to join the discussion and share your views on this chart.
            </p>
            <Button
              onClick={() => window.location.href = '/profile'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Login to Comment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Reply Form */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Reply to Comment</h4>
              <form onSubmit={handleSubmitReply}>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="mb-3"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!replyContent.trim() || createCommentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Reply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}