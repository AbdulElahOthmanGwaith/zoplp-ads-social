import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { Post, Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Camera, 
  Edit, 
  MapPin, 
  Calendar, 
  Users, 
  FileText, 
  Heart,
  MessageCircle,
  Save,
  Plus,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import PostComponent from './PostComponent'

const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth()
  const { uploadMedia, uploading } = useMediaUpload()
  const [isEditing, setIsEditing] = useState(false)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({
    postsCount: 0,
    friendsCount: 0,
    totalLikes: 0,
    totalComments: 0
  })
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    age: profile?.age || '',
    location: profile?.location || '',
    interests: profile?.interests || []
  })
  const [newInterest, setNewInterest] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name,
        bio: profile.bio || '',
        age: profile.age?.toString() || '',
        location: profile.location || '',
        interests: profile.interests || []
      })
      loadUserData()
    }
  }, [profile])

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load user posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      setUserPosts(posts || [])

      // Load statistics
      const { count: friendsCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      let totalLikes = 0
      let totalComments = 0
      
      if (posts && posts.length > 0) {
        totalLikes = posts.reduce((sum, post) => sum + post.likes_count, 0)
        totalComments = posts.reduce((sum, post) => sum + post.comments_count, 0)
      }

      setStats({
        postsCount: posts?.length || 0,
        friendsCount: friendsCount || 0,
        totalLikes,
        totalComments
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('فشل في تحميل بيانات الملف الشخصي')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const avatarUrl = await uploadMedia(file, 'avatar')
      // Avatar is automatically updated by the edge function
      toast.success('تم تحديث الصورة الشخصية')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('فشل في تحديث الصورة')
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: editData.full_name,
        bio: editData.bio,
        age: editData.age ? parseInt(editData.age.toString()) : undefined,
        location: editData.location,
        interests: editData.interests
      })
      
      setIsEditing(false)
      toast.success('تم حفظ التغييرات')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('فشل في حفظ التغييرات')
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && !editData.interests.includes(newInterest.trim())) {
      setEditData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6" dir="rtl">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <CardContent className="relative">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-16 pb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera Icon for Avatar Upload */}
              <label className="absolute bottom-0 left-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="ml-1 h-4 w-4" />
              تعديل الملف
            </Button>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
              <p className="text-gray-600">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-gray-700 mt-2">{profile.bio}</p>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {profile?.age && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  <Calendar className="h-4 w-4" />
                  <span>{profile.age} سنة</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>

            {/* Interests */}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">الاهتمامات</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.postsCount}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center space-x-1 space-x-reverse">
              <FileText className="h-4 w-4" />
              <span>منشور</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.friendsCount}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center space-x-1 space-x-reverse">
              <Users className="h-4 w-4" />
              <span>صديق</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">{stats.totalLikes}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center space-x-1 space-x-reverse">
              <Heart className="h-4 w-4" />
              <span>إعجاب</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalComments}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center space-x-1 space-x-reverse">
              <MessageCircle className="h-4 w-4" />
              <span>تعليق</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>منشوراتي ({userPosts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>لم تقم بنشر أي منشورات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <PostComponent 
                  key={post.id} 
                  post={{ ...post, author: profile! }} 
                  onUpdate={loadUserData}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الملف الشخصي</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                className="text-right"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نبذة شخصية</label>
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="اكتب شيئاً عن نفسك..."
                className="text-right min-h-[80px]"
              />
            </div>

            {/* Age and Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">العمر</label>
                <Input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData(prev => ({ ...prev, age: e.target.value }))}
                  className="text-center"
                  min="13"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الموقع</label>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="الرياض, جدة..."
                  className="text-right"
                />
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <label className="text-sm font-medium">الاهتمامات</label>
              
              {/* Add Interest */}
              <div className="flex space-x-2 space-x-reverse">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="إضافة اهتمام..."
                  className="text-right"
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addInterest}
                  disabled={!newInterest.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Current Interests */}
              {editData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editData.interests.map((interest, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditData({
                    full_name: profile?.full_name || '',
                    bio: profile?.bio || '',
                    age: profile?.age?.toString() || '',
                    location: profile?.location || '',
                    interests: profile?.interests || []
                  })
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="ml-1 h-4 w-4" />
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage