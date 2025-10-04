import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Home, 
  Search, 
  Bell, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  Users,
  ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NavigationBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  const { user, profile, signOut } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotificationCounts()
      // Update user status to online
      updateUserStatus(true)
      
      // Set up real-time subscriptions for notifications
      const notificationSubscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => loadNotificationCounts()
        )
        .subscribe()

      const messageSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          () => loadNotificationCounts()
        )
        .subscribe()

      return () => {
        notificationSubscription.unsubscribe()
        messageSubscription.unsubscribe()
        // Set user status to offline when component unmounts
        updateUserStatus(false)
      }
    }
  }, [user])

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

  const updateUserStatus = async (isOnline: boolean) => {
    try {
      await supabase.functions.invoke('update-user-status', {
        body: {
          isOnline,
          statusMessage: isOnline ? 'نشط' : 'غير نشط'
        }
      })
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleSignOut = async () => {
    await updateUserStatus(false)
    await signOut()
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
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Welcome */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 rounded-lg">
                <span className="font-bold text-lg">Z</span>
              </div>
              <h1 className="text-xl font-bold text-blue-600">ZOPLP ADS</h1>
            </div>
            <div className="hidden md:block text-sm text-gray-600">
              {getWelcomeMessage()}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 space-x-reverse">
            <Button
              variant={activeTab === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('home')}
              className="relative"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">الرئيسية</span>
            </Button>
            
            <Button
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('search')}
              className="relative"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">بحث</span>
            </Button>
            
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('messages')}
              className="relative"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">رسائل</span>
              <NotificationBadge count={unreadMessages} />
            </Button>
            
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('notifications')}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">إشعارات</span>
              <NotificationBadge count={unreadNotifications} />
            </Button>
          </nav>

          {/* Profile Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 space-x-reverse p-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Profile Info */}
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

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onTabChange('profile')
                      setShowProfileMenu(false)
                    }}
                    className="w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center space-x-3 space-x-reverse"
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <span>الملف الشخصي</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onTabChange('settings')
                      setShowProfileMenu(false)
                    }}
                    className="w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center space-x-3 space-x-reverse"
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span>الإعدادات</span>
                  </button>
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        handleSignOut()
                        setShowProfileMenu(false)
                      }}
                      className="w-full px-4 py-2 text-right text-sm hover:bg-red-50 flex items-center space-x-3 space-x-reverse text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  )
}

export default NavigationBar