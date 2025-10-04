import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Post, Profile, TextComment, VoiceComment, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Heart, MessageCircle, Share, MoreHorizontal, Play, Pause, Laugh, Frown, ThumbsUp, Angry, Link, Image } from 'lucide-react'
import { toast } from 'react-hot-toast'
import VoiceCommentRecorder from './VoiceCommentRecorder'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

interface PostComponentProps {
  post: Post & { author: Profile }
  onUpdate: () => void
}

const PostComponent: React.FC<PostComponentProps> = ({ post, onUpdate }) => {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [textComments, setTextComments] = useState<(TextComment & { author: Profile })[]>([])
  const [voiceComments, setVoiceComments] = useState<(VoiceComment & { author: Profile })[]>([])
  const [newComment, setNewComment] = useState('')
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})
  const [showReactions, setShowReactions] = useState(false)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUrlDialog, setShowUrlDialog] = useState(false)
  const [urlToShare, setUrlToShare] = useState('')
  const [urlPreview, setUrlPreview] = useState<any>(null)

  useEffect(() => {
    checkIfLiked()
  }, [post.id, user?.id])

  const checkIfLiked = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
    
    setLiked(!!data)
  }

  const handleLike = async () => {
    if (!user) return

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        
        setLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          })
        
        setLiked(true)
        setLikesCount(prev => prev + 1)
        
        // Send notification to post author
        if (post.author_id !== user.id) {
          await supabase.functions.invoke('send-notification', {
            body: {
              userId: post.author_id,
              type: 'post_liked',
              title: 'إعجاب جديد',
              message: `أعجب ${user.user_metadata?.full_name || 'شخص'} بمنشورك`,
              data: { postId: post.id }
            }
          })
        }
      }
    } catch (error) {
      console.error('Error handling like:', error)
      toast.error('فشل في معالجة الإعجاب')
    }
  }

  const loadComments = async () => {
    if (!showComments) return

    try {
      // Load text comments
      const { data: textCommentsData } = await supabase
        .from('text_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      // Load voice comments
      const { data: voiceCommentsData } = await supabase
        .from('voice_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      // Load authors for comments
      const allCommentUserIds = [
        ...(textCommentsData || []).map(c => c.user_id),
        ...(voiceCommentsData || []).map(c => c.user_id)
      ]
      const uniqueUserIds = [...new Set(allCommentUserIds)]

      if (uniqueUserIds.length > 0) {
        const { data: authors } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', uniqueUserIds)

        // Add author data to comments
        const textWithAuthors = (textCommentsData || []).map(comment => ({
          ...comment,
          author: authors?.find(a => a.user_id === comment.user_id) || {} as Profile
        }))

        const voiceWithAuthors = (voiceCommentsData || []).map(comment => ({
          ...comment,
          author: authors?.find(a => a.user_id === comment.user_id) || {} as Profile
        }))

        setTextComments(textWithAuthors)
        setVoiceComments(voiceWithAuthors)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleAddTextComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      // Filter comment content
      const { data: filterResult, error: filterError } = await supabase.functions.invoke('content-filter', {
        body: {
          content: newComment,
          contentType: 'text'
        }
      })

      if (filterError || !filterResult.data.approved) {
        toast.error('التعليق لا يتفق مع معايير المجتمع')
        return
      }

      const { error } = await supabase
        .from('text_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment
        })

      if (error) throw error

      setNewComment('')
      await loadComments()
      toast.success('تم إضافة التعليق')
      
      // Send notification
      if (post.author_id !== user.id) {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: post.author_id,
            type: 'post_commented',
            title: 'تعليق جديد',
            message: `علق ${user.user_metadata?.full_name || 'شخص'} على منشورك`,
            data: { postId: post.id }
          }
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('فشل في إضافة التعليق')
    }
  }

  const handleVoiceCommentAdded = async () => {
    await loadComments()
    setShowVoiceRecorder(false)
    
    // Send notification
    if (post.author_id !== user?.id && user) {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: post.author_id,
          type: 'voice_comment_added',
          title: 'تعليق صوتي جديد',
          message: `أضاف ${user.user_metadata?.full_name || 'شخص'} تعليقاً صوتياً على منشورك`,
          data: { postId: post.id }
        }
      })
    }
  }

  const toggleAudio = (audioUrl: string, commentId: string) => {
    if (playingAudio === commentId) {
      // Pause current audio
      if (audioElements[commentId]) {
        audioElements[commentId].pause()
      }
      setPlayingAudio(null)
    } else {
      // Stop any playing audio
      if (playingAudio && audioElements[playingAudio]) {
        audioElements[playingAudio].pause()
        audioElements[playingAudio].currentTime = 0
      }

      // Create or get audio element
      let audio = audioElements[commentId]
      if (!audio) {
        audio = new Audio(audioUrl)
        audio.addEventListener('ended', () => setPlayingAudio(null))
        setAudioElements(prev => ({ ...prev, [commentId]: audio }))
      }

      audio.play()
      setPlayingAudio(commentId)
    }
  }

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments])

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ar
    })
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Avatar>
              <AvatarImage src={post.author?.avatar_url || ''} alt={post.author?.full_name || ''} />
              <AvatarFallback>{post.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.author?.full_name}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap mb-3">{post.content}</p>
          
          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid gap-2 mb-3">
              {post.media_urls.map((url, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {post.media_type === 'video' ? (
                    <video 
                      src={url} 
                      controls 
                      className="w-full max-h-96 object-cover"
                    />
                  ) : (
                    <img 
                      src={url} 
                      alt={`صورة المنشور ${index + 1}`}
                      className="w-full max-h-96 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={liked ? 'text-red-500' : 'text-gray-500'}
            >
              <Heart className={`ml-1 h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowComments(!showComments)}
              className="text-gray-500"
            >
              <MessageCircle className="ml-1 h-4 w-4" />
              {post.comments_count}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Share className="ml-1 h-4 w-4" />
              مشاركة
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4">
            {/* Add Comment */}
            <div className="space-y-3">
              <div className="flex space-x-2 space-x-reverse">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={''} alt="" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="اكتب تعليقاً..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] text-right"
                  />
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVoiceRecorder(true)}
                    >
                      تعليق صوتي
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddTextComment}
                      disabled={!newComment.trim()}
                    >
                      نشر
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Comment Recorder */}
            {showVoiceRecorder && (
              <VoiceCommentRecorder
                postId={post.id}
                onCommentAdded={handleVoiceCommentAdded}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {/* Text Comments */}
              {textComments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 space-x-reverse">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.author?.avatar_url || ''} alt={comment.author?.full_name || ''} />
                    <AvatarFallback>{comment.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{comment.author?.full_name}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</p>
                    </div>
                    <p className="text-sm text-gray-900">{comment.content}</p>
                  </div>
                </div>
              ))}

              {/* Voice Comments */}
              {voiceComments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 space-x-reverse">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.author?.avatar_url || ''} alt={comment.author?.full_name || ''} />
                    <AvatarFallback>{comment.author?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{comment.author?.full_name}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</p>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAudio(comment.audio_url, comment.id)}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
                      >
                        {playingAudio === comment.id ? (
                          <Pause className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Play className="h-4 w-4 text-blue-600" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="bg-blue-200 h-2 rounded-full">
                          <div className="bg-blue-500 h-2 rounded-full w-0" />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {comment.duration_seconds}ث
                      </span>
                    </div>
                    {comment.transcription && (
                      <p className="text-xs text-gray-600 mt-2 italic">{comment.transcription}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PostComponent