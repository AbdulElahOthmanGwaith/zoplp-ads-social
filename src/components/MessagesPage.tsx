import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Phone, Video, MoreVertical, Circle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  message_type: string
  media_url?: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

interface Conversation {
  friend: Profile & { is_online?: boolean; last_seen?: string }
  lastMessage?: Message
  unreadCount: number
}

const MessagesPage: React.FC = () => {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      markMessagesAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) return

    // Set up real-time message subscription
    const messageSubscription = supabase
      .channel('user-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          
          // If this message is for the currently selected conversation
          if (selectedConversation === newMessage.sender_id) {
            setMessages(prev => [...prev, newMessage])
            markMessagesAsRead(newMessage.sender_id)
          }
          
          // Refresh conversations list
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [user, selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    if (!user) return

    try {
      // Get user's friends
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (!friends || friends.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const friendIds = friends.map(f => f.friend_id)

      // Get friend profiles with online status
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          user_status!left(
            is_online,
            last_seen
          )
        `)
        .in('user_id', friendIds)

      if (!profiles) {
        setConversations([])
        setLoading(false)
        return
      }

      // Get last message for each conversation
      const conversationsData: Conversation[] = []
      
      for (const friendProfile of profiles) {
        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendProfile.user_id}),and(sender_id.eq.${friendProfile.user_id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)

        // Count unread messages from this friend
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', friendProfile.user_id)
          .eq('receiver_id', user.id)
          .eq('is_read', false)

        conversationsData.push({
          friend: {
            ...friendProfile,
            is_online: friendProfile.user_status?.[0]?.is_online,
            last_seen: friendProfile.user_status?.[0]?.last_seen
          },
          lastMessage: lastMessages?.[0],
          unreadCount: unreadCount || 0
        })
      }

      // Sort by last message time
      conversationsData.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || ''
        const bTime = b.lastMessage?.created_at || ''
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setConversations(conversationsData)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('فشل في تحميل المحادثات')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (friendId: string) => {
    if (!user) return

    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('فشل في تحميل الرسائل')
    }
  }

  const markMessagesAsRead = async (senderId: string) => {
    if (!user) return

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          receiverId: selectedConversation,
          content: newMessage,
          messageType: 'text'
        }
      })

      if (error) {
        console.error('Error sending message:', error)
        toast.error('فشل في إرسال الرسالة')
        return
      }

      // Add message to local state
      const messageData = data.data.message
      setMessages(prev => [...prev, {
        ...messageData,
        sender: profile
      }])
      
      setNewMessage('')
      toast.success('تم إرسال الرسالة')
      
      // Refresh conversations
      loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('فشل في إرسال الرسالة')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const selectedFriend = conversations.find(c => c.friend.user_id === selectedConversation)?.friend

  return (
    <div className="max-w-6xl mx-auto py-6 px-4" dir="rtl">
      <Card className="h-[600px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-l border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg">المحادثات</CardTitle>
          </CardHeader>
          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>لا توجد محادثات بعد</p>
                <p className="text-sm">ابدأ بإضافة أصدقاء!</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.friend.user_id}
                  onClick={() => setSelectedConversation(conversation.friend.user_id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.friend.user_id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.friend.avatar_url || ''} alt={conversation.friend.full_name} />
                        <AvatarFallback>{conversation.friend.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      {conversation.friend.is_online && (
                        <Circle className="absolute bottom-0 left-0 h-3 w-3 text-green-500 fill-current border border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{conversation.friend.full_name}</p>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.content || 'لا توجد رسائل'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedFriend.avatar_url || ''} alt={selectedFriend.full_name} />
                        <AvatarFallback>{selectedFriend.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      {selectedFriend.is_online && (
                        <Circle className="absolute bottom-0 left-0 h-3 w-3 text-green-500 fill-current border border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedFriend.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedFriend.is_online ? 'نشط الآن' : 
                          selectedFriend.last_seen ? 
                          `آخر ظهور ${formatDistanceToNow(new Date(selectedFriend.last_seen), { addSuffix: true, locale: ar })}` :
                          'غير نشط'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-2 space-x-reverse ${
                        isOwnMessage ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <Avatar className="h-8 w-8 mb-1">
                          <AvatarImage src={selectedFriend.avatar_url || ''} alt={selectedFriend.full_name} />
                          <AvatarFallback>{selectedFriend.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-8" />
                      )}
                      
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p 
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </p>
                      </div>
                      
                      {isOwnMessage && showAvatar && (
                        <Avatar className="h-8 w-8 mb-1">
                          <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                          <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      {isOwnMessage && !showAvatar && (
                        <div className="w-8" />
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="flex-1 text-right"
                    onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center space-y-3">
                <div className="bg-gray-100 rounded-full p-8 mx-auto w-fit">
                  <Send className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">اختر محادثة</h3>
                <p>اختر صديقاً لبدء المحادثة</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default MessagesPage