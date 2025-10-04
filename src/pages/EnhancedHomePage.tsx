import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Post, Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Home, 
  Search, 
  Bell, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Plus,
  Filter,
  Users,
  Sparkles,
  TrendingUp,
  Calendar,
  Moon,
  Sun,
  Wifi
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import PostComponent from '@/components/PostComponent'
import UserSearchPanel from '@/components/UserSearchPanel'
import ProfilePage from '@/components/ProfilePage'
import MessagesPage from '@/components/MessagesPage'
import NotificationsPage from '@/components/NotificationsPage'

interface SuggestedFriend {
  user_id: string
  full_name: string
  username: string
  avatar_url?: string
  common_interests?: string[]
  mutual_friends?: number
}

const EnhancedHomePage: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const [posts, setPosts] = useState<(Post & { author: Profile })[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user && profile) {
      loadInitialData()
      loadNotificationCounts()
      loadFriendSuggestions()
    }
  }, [user, profile])

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await loadPosts()
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
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
    }
  }

  const loadNotificationCounts = async () => {
    if (!user) return

    try {
      // Count unread notifications
      const { count: notificationCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      // Count unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      setUnreadNotifications(notificationCount || 0)
      setUnreadMessages(messageCount || 0)
    } catch (error) {
      console.error('Error loading notification counts:', error)
    }
  }

  const loadFriendSuggestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('friend-suggestions', {
        body: { limit: 3 }
      })
      
      if (error) {
        console.error('Error loading friend suggestions:', error)
        return
      }

      setSuggestedFriends(data.data?.suggestions || [])
    } catch (error) {
      console.error('Error loading friend suggestions:', error)
    }
  }

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user?.id,
          receiver_id: targetUserId,
          status: 'pending'
        })

      if (error) throw error

      toast.success('تم إرسال طلب الصداقة')
      setSuggestedFriends(prev => prev.filter(f => f.user_id !== targetUserId))
      await loadFriendSuggestions()
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('فشل في إرسال طلب الصداقة')
    }
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    const name = profile?.full_name || 'مرحبا'
    
    if (hour < 12) {
      return `صباح الخير، ${name}!`
    } else if (hour < 18) {
      return `مساء الخير، ${name}!`
    } else {
      return `مساء الخير، ${name}!`
    }
  }

  const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null
    return (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
        {count > 9 ? '9+' : count}
      </span>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Stories Section */}
            <div className="mb-4">
              <div className="flex space-x-4 space-x-reverse overflow-x-auto scrollbar-hide pb-2">
                {/* Add Story */}
                <div className="flex flex-col items-center min-w-[80px] cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-dashed border-gray-300">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center">إضافة قصة</span>
                </div>

                {/* Friends Stories */}
                {['فؤاد حسان', 'nabhan fans', 'مريم أحمد', 'أحمد علي', 'نور فاطمة'].map((name, index) => (
                  <div key={index} className="flex flex-col items-center min-w-[80px] cursor-pointer">
                    <Avatar className="h-16 w-16 border-2 border-blue-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400"></div>
                    </Avatar>
                    <span className="text-xs text-gray-800 mt-2 text-center max-w-[80px] truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Post */}
            <Card className="mb-4 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <Button 
                    className="flex-1 justify-start bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-normal"
                    variant="outline"
                  >
                    يم تفكيرك؟
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-6 mx-auto w-fit mb-4">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ابدأ رحلتك الاجتماعية!</h3>
                  <p className="text-gray-600 mb-4">اعثر على أصدقاء جدد وابدأ في مشاركة لحظاتك المميزة</p>
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
          <div className="max-w-4xl mx-auto">
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
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="h-6 w-6 ml-3 text-blue-600" />
                إعدادات التطبيق
              </h2>
              
              {/* Theme Settings */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">المظهر</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {darkMode ? <Moon className="h-5 w-5 text-gray-600" /> : <Sun className="h-5 w-5 text-gray-600" />}
                      <span className="text-gray-700">الوضع الليلي</span>
                    </div>
                    <Button
                      onClick={() => setDarkMode(!darkMode)}
                      variant={darkMode ? "default" : "outline"}
                      size="sm"
                    >
                      {darkMode ? 'مفعل' : 'غير مفعل'}
                    </Button>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">حالة الاتصال</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Wifi className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">حالة الاتصال</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isOnline ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                </div>

                {/* App Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">معلومات التطبيق</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">اسم التطبيق</span>
                      <span className="font-medium">ZOPLP ADS Social</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الإصدار</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ التحديث</span>
                      <span className="font-medium">سبتمبر 2025</span>
                    </div>
                  </div>
                </div>

                {/* Notifications Settings */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">إعدادات الإشعارات</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">إشعارات المنشورات الجديدة</span>
                      <Button variant="outline" size="sm">مفعل</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">إشعارات الرسائل</span>
                      <Button variant="outline" size="sm">مفعل</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">إشعارات طلبات الصداقة</span>
                      <Button variant="outline" size="sm">مفعل</Button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">إجراءات الحساب</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 ml-2" />
                      تعديل الملف الشخصي
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`} dir="rtl">
      {/* Facebook-Style Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        {/* Top Row - Icons */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Right Side Icons */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 hover:bg-gray-100 rounded-full"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    9+
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('search')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Search className="h-5 w-5 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus className="h-5 w-5 text-gray-600" />
                </Button>
              </div>

              {/* Center Title */}
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold text-blue-600">
                  ZOPLP ADS
                </h1>
              </div>

              {/* Left Side - Profile */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 space-x-reverse p-1 hover:bg-gray-100 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>

                {showProfileMenu && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                          <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{profile?.full_name}</p>
                          <p className="text-xs text-gray-500">@{profile?.username}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile')
                          setShowProfileMenu(false)
                        }}
                        className="w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center space-x-3 space-x-reverse"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <span>الملف الشخصي</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveTab('settings')
                          setShowProfileMenu(false)
                        }}
                        className="w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center space-x-3 space-x-reverse"
                      >
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>الإعدادات</span>
                      </button>
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          signOut()
                          setShowProfileMenu(false)
                        }}
                        className="w-full px-4 py-2 text-right text-sm hover:bg-red-50 flex items-center space-x-3 space-x-reverse text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Navigation */}
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center space-x-8 space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('messages')}
              className="relative flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="relative">
                <MessageSquare className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  97
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">رسائل</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setActiveTab('notifications')}
              className="relative flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  14
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">إشعارات</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setActiveTab('search')}
              className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg"
            >
              <Users className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">أصدقاء</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setActiveTab('settings')}
              className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">إعدادات</span>
            </Button>
            
            <Button
              variant={activeTab === 'home' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Home className={`h-6 w-6 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-xs mt-1 ${activeTab === 'home' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>الرئيسية</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {renderContent()}
      </main>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  )
}

export default EnhancedHomePage