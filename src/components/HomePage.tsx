import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Post, Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Heart, MessageCircle, Share, Plus, Image, Video, LogOut, User, Settings, Link, Sparkles, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import PostComponent from './PostComponent'
import NavigationBar from './NavigationBar'
import UserSearchPanel from './UserSearchPanel'
import ProfilePage from './ProfilePage'
import MessagesPage from './MessagesPage'
import NotificationsPage from './NotificationsPage'

const HomePage: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const { uploadMedia, uploading } = useMediaUpload()
  const [posts, setPosts] = useState<(Post & { author: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [showWelcome, setShowWelcome] = useState(false)
  const [urlToAdd, setUrlToAdd] = useState('')
  const [urlPreview, setUrlPreview] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    if (user && profile) {
      loadPosts()
      checkIfNewUser()
    }
  }, [user, profile])

  const checkIfNewUser = () => {
    if (profile) {
      const accountAge = Date.now() - new Date(profile.created_at).getTime()
      const isNewUser = accountAge < 24 * 60 * 60 * 1000 // Less than 24 hours
      setShowWelcome(isNewUser)
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      
      // Get user's friends first
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user?.id)
        .eq('status', 'accepted')

      const friendIds = friends?.map(f => f.friend_id) || []
      const visibleUserIds = [user?.id, ...friendIds]

      // Load posts from friends and user
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .in('author_id', visibleUserIds)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading posts:', error)
        return
      }

      // Load authors for posts
      const authorIds = [...new Set(postsData.map(post => post.author_id))]
      const { data: authors } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', authorIds)

      // Combine posts with author data
      const postsWithAuthors = postsData.map(post => ({
        ...post,
        author: authors?.find(author => author.user_id === post.author_id) || {} as Profile
      }))

      setPosts(postsWithAuthors)
    } catch (error) {
      console.error('Error loading posts:', error)
      toast.error('فشل في تحميل المنشورات')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlPreview = async () => {
    if (!urlToAdd.trim()) return

    // Validate URL
    try {
      new URL(urlToAdd)
    } catch {
      toast.error('رابط غير صحيح')
      return
    }

    setLoadingPreview(true)
    try {
      const { data, error } = await supabase.functions.invoke('url-preview', {
        body: { url: urlToAdd }
      })

      if (error) {
        console.error('URL preview error:', error)
        toast.error('فشل في تحميل معاينة الرابط')
        return
      }

      setUrlPreview(data.data.preview)
      toast.success('تم تحميل معاينة الرابط')
    } catch (error) {
      console.error('Error getting URL preview:', error)
      toast.error('فشل في معاينة الرابط')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0 && !urlPreview) {
      toast.error('يرجى إدخال محتوى أو اختيار ملفات')
      return
    }

    setSubmitting(true)
    try {
      // Filter content first
      const { data: filterResult, error: filterError } = await supabase.functions.invoke('content-filter', {
        body: {
          content: newPostContent,
          contentType: 'text'
        }
      })

      if (filterError || !filterResult.data.approved) {
        toast.error('المحتوى لا يتفق مع معايير المجتمع')
        return
      }

      // Upload media files if any
      const mediaUrls: string[] = []
      for (const file of selectedFiles) {
        const url = await uploadMedia(file, 'post-media')
        mediaUrls.push(url)
      }

      // Add URL preview if available
      let finalContent = newPostContent
      if (urlPreview) {
        finalContent += `\n\n🔗 ${urlPreview.title}\n${urlPreview.description}\n${urlPreview.url}`
        if (urlPreview.image) {
          mediaUrls.push(urlPreview.image)
        }
      }

      // Create post
      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: user?.id,
          content: finalContent,
          media_urls: mediaUrls,
          media_type: selectedFiles.length > 0 ? (selectedFiles[0].type.startsWith('video') ? 'video' : 'image') : 
                      (urlPreview?.image ? 'image' : null),
          audience_type: 'friends',
          is_public: false
        })

      if (error) {
        console.error('Error creating post:', error)
        toast.error('فشل في نشر المنشور')
        return
      }

      toast.success('تم نشر المنشور بنجاح')
      setNewPostContent('')
      setSelectedFiles([])
      setUrlToAdd('')
      setUrlPreview(null)
      setShowCreatePost(false)
      await loadPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('فشل في نشر المنشور')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5)) // Max 5 files
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeUrlPreview = () => {
    setUrlPreview(null)
    setUrlToAdd('')
  }

  const WelcomeMessage: React.FC = () => {
    if (!showWelcome) return null

    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) return 'صباح الخير'
      if (hour < 18) return 'مساء الخير'
      return 'مساء الخير'
    }

    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-3 rounded-full">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {getTimeBasedGreeting()}، {profile?.full_name}!
              </h2>
              <p className="text-gray-700 mb-3">
                مرحباً بك في منصة ZOPLP ADS – مجتمعك الآمن للتواصل والمشاركة
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                  <User className="h-4 w-4" />
                  <span>أكمل ملفك الشخصي</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                  <Users className="h-4 w-4" />
                  <span>ابحث عن أصدقاء</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-purple-600">
                  <MessageCircle className="h-4 w-4" />
                  <span>ابدأ المحادثة</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && activeTab === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
            <WelcomeMessage />
            
            {/* Create Post Button */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button 
                  onClick={() => setShowCreatePost(true)} 
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Plus className="ml-2 h-5 w-5" />
                  ماذا تريد أن تشارك اليوم؟
                </Button>
              </CardContent>
            </Card>

            {/* Posts */}
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-6 mx-auto w-fit mb-4">
                    <MessageCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منشورات بعد</h3>
                  <p className="text-gray-600 mb-4">ابدأ بإضافة أصدقاء لرؤية منشوراتهم!</p>
                  <Button
                    onClick={() => setActiveTab('search')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ابحث عن أصدقاء
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <PostComponent 
                  key={post.id} 
                  post={post} 
                  onUpdate={loadPosts}
                />
              ))
            )}
          </div>
        )
      
      case 'search':
        return (
          <div className="max-w-4xl mx-auto py-6 px-4">
            <UserSearchPanel />
          </div>
        )
      
      case 'messages':
        return <MessagesPage />
      
      case 'notifications':
        return <NotificationsPage />
      
      case 'profile':
        return <ProfilePage />
      
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto py-6 px-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">الإعدادات</h3>
                <p className="text-gray-600">قيد التطوير...</p>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30" dir="rtl">
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {renderContent()}

      {/* Enhanced Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 space-x-reverse">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>إنشاء منشور جديد</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="ماذا تريد أن تشارك؟"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[120px] text-right resize-none"
            />
            
            {/* URL Sharing */}
            <div className="space-y-3">
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  placeholder="أدخل رابط لمشاركته..."
                  value={urlToAdd}
                  onChange={(e) => setUrlToAdd(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUrlPreview}
                  disabled={!urlToAdd.trim() || loadingPreview}
                >
                  {loadingPreview ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* URL Preview */}
              {urlPreview && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      {urlPreview.image && (
                        <img 
                          src={urlPreview.image} 
                          alt="معاينة الرابط"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {urlPreview.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {urlPreview.description}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 truncate">
                          {urlPreview.url}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeUrlPreview}
                      >
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">الملفات المختارة:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {file.type.startsWith('image') ? (
                        <Image className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Video className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Media Upload Buttons */}
            <div className="flex space-x-3 space-x-reverse border-t pt-4">
              <label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Image className="ml-1 h-4 w-4 text-blue-600" />
                    صور
                  </span>
                </Button>
              </label>
              <label>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Video className="ml-1 h-4 w-4 text-green-600" />
                    فيديو
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreatePost(false)
                  setNewPostContent('')
                  setSelectedFiles([])
                  setUrlToAdd('')
                  setUrlPreview(null)
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={submitting || uploading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {submitting || uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    نشر
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HomePage