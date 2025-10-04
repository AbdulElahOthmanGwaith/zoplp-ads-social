import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Notification, Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Mic,
  X,
  Trash2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

interface NotificationWithProfile extends Notification {
  sender_profile?: Profile
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadNotifications()
      
      // Set up real-time subscription for new notifications
      const subscription = supabase
        .channel('user-notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => loadNotifications()
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      // Get sender profiles for notifications that have sender data
      const notificationsWithSenders = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          if (notification.data?.senderId) {
            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', notification.data.senderId)
                .maybeSingle()

              return {
                ...notification,
                sender_profile: senderProfile
              }
            } catch (error) {
              console.error('Error loading sender profile:', error)
              return notification
            }
          }
          return notification
        })
      )

      setNotifications(notificationsWithSenders)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('فشل في تحميل الإشعارات')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (markingAsRead.includes(notificationId)) return

    setMarkingAsRead(prev => [...prev, notificationId])
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notificationId))
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        toast.error('فشل في تحديث الإشعارات')
        return
      }

      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true
      })))
      
      toast.success('تم تمييز جميع الإشعارات كمقروءة')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('فشل في تحديث الإشعارات')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('تم حذف الإشعار')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('فشل في حذف الإشعار')
    }
  }

  const handleFriendRequest = async (notificationId: string, action: 'accept' | 'reject', senderId: string) => {
    try {
      if (action === 'accept') {
        // Accept friend request
        const { error: friendError } = await supabase
          .from('friends')
          .insert([
            { user_id: user?.id, friend_id: senderId, status: 'accepted' },
            { user_id: senderId, friend_id: user?.id, status: 'accepted' }
          ])

        if (friendError) {
          console.error('Error accepting friend request:', friendError)
          toast.error('فشل في قبول طلب الصداقة')
          return
        }

        // Update friend request status
        await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('sender_id', senderId)
          .eq('receiver_id', user?.id)

        // Send acceptance notification
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: senderId,
            type: 'friend_accepted',
            title: 'تم قبول طلب الصداقة',
            message: `قبل ${user?.user_metadata?.full_name || 'شخص'} طلب صداقتك`,
            data: { friendId: user?.id }
          }
        })

        toast.success('تم قبول طلب الصداقة')
      } else {
        // Reject friend request
        await supabase
          .from('friend_requests')
          .update({ status: 'rejected' })
          .eq('sender_id', senderId)
          .eq('receiver_id', user?.id)

        toast.success('تم رفض طلب الصداقة')
      }

      // Mark notification as read
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Error handling friend request:', error)
      toast.error('فشل في معالجة طلب الصداقة')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-blue-600" />
      case 'friend_accepted':
        return <UserPlus className="h-5 w-5 text-green-600" />
      case 'post_liked':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'post_commented':
        return <MessageCircle className="h-5 w-5 text-purple-600" />
      case 'voice_comment_added':
        return <Mic className="h-5 w-5 text-orange-600" />
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 space-x-reverse">
              <Bell className="h-6 w-6 text-blue-600" />
              <span>الإشعارات</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="ml-1 h-4 w-4" />
                تمييز الكل كمقروء
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد إشعارات</h3>
              <p className="text-gray-600">ستظهر إشعاراتك هنا عندما يتفاعل الآخرون معك</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`${!notification.is_read ? 'border-blue-200 bg-blue-50/30' : ''} hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4 space-x-reverse">
                  {/* Notification Icon */}
                  <div className="flex-shrink-0">
                    {notification.sender_profile ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={notification.sender_profile.avatar_url || ''} 
                          alt={notification.sender_profile.full_name} 
                        />
                        <AvatarFallback>
                          {notification.sender_profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </p>
                      </div>
                      
                      {/* Notification Actions */}
                      <div className="flex items-center space-x-2 space-x-reverse ml-4">
                        {/* Friend Request Actions */}
                        {notification.type === 'friend_request' && !notification.is_read && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFriendRequest(notification.id, 'reject', notification.data?.senderId)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              رفض
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleFriendRequest(notification.id, 'accept', notification.data?.senderId)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              قبول
                            </Button>
                          </>
                        )}
                        
                        {/* Mark as Read Button */}
                        {!notification.is_read && notification.type !== 'friend_request' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            disabled={markingAsRead.includes(notification.id)}
                          >
                            {markingAsRead.includes(notification.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unread Indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {notifications.length >= 50 && (
        <div className="text-center">
          <Button variant="outline" onClick={loadNotifications}>
            تحميل مزيد
          </Button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage