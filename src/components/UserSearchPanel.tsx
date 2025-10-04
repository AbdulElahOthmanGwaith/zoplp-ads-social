import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Profile, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, UserPlus, Filter, MapPin, Calendar, Users, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SearchResult extends Profile {
  relationship_status: 'friend' | 'request_sent' | 'request_received' | 'none'
}

const UserSearchPanel: React.FC = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    location: '',
    interests: [] as string[]
  })

  useEffect(() => {
    loadFriendSuggestions()
  }, [])

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const debounceTimeout = setTimeout(() => {
        handleSearch()
      }, 500)
      return () => clearTimeout(debounceTimeout)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, filters])

  const loadFriendSuggestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('friend-suggestions')
      
      if (error) {
        console.error('Error loading suggestions:', error)
        return
      }

      setSuggestions(data.data.suggestions || [])
    } catch (error) {
      console.error('Error loading friend suggestions:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('user-search', {
        body: {
          query: searchQuery,
          filters: {
            minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
            maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
            location: filters.location || undefined,
            interests: filters.interests.length > 0 ? filters.interests : undefined
          }
        }
      })

      if (error) {
        console.error('Search error:', error)
        toast.error('فشل في عملية البحث')
        return
      }

      setSearchResults(data.data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('فشل في البحث عن المستخدمين')
    } finally {
      setLoading(false)
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

      if (error) {
        console.error('Error sending friend request:', error)
        toast.error('فشل في إرسال طلب الصداقة')
        return
      }

      toast.success('تم إرسال طلب الصداقة')
      
      // Update local state
      setSearchResults(prev => prev.map(user => 
        user.user_id === targetUserId 
          ? { ...user, relationship_status: 'request_sent' }
          : user
      ))
      
      setSuggestions(prev => prev.map(user => 
        user.user_id === targetUserId 
          ? { ...user, relationship_status: 'request_sent' }
          : user
      ))

      // Send notification
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: targetUserId,
          type: 'friend_request',
          title: 'طلب صداقة جديد',
          message: `أرسل لك ${user?.user_metadata?.full_name || 'شخص'} طلب صداقة`,
          data: { senderId: user?.id }
        }
      })
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('فشل في إرسال طلب الصداقة')
    }
  }

  const dismissSuggestion = async (suggestionUserId: string) => {
    try {
      await supabase
        .from('friend_suggestions')
        .update({ is_dismissed: true })
        .eq('user_id', user?.id)
        .eq('suggested_user_id', suggestionUserId)

      setSuggestions(prev => prev.filter(s => s.user_id !== suggestionUserId))
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
    }
  }

  const UserCard: React.FC<{ user: SearchResult; showDismiss?: boolean }> = ({ user, showDismiss = false }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
            <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{user.full_name}</h3>
            <p className="text-xs text-gray-500">@{user.username}</p>
            {user.location && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="ml-1 h-3 w-3" />
                {user.location}
              </div>
            )}
            {user.age && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Calendar className="ml-1 h-3 w-3" />
                {user.age} سنة
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {showDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissSuggestion(user.user_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {user.relationship_status === 'none' && (
            <Button
              size="sm"
              onClick={() => sendFriendRequest(user.user_id)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="ml-1 h-4 w-4" />
              إضافة
            </Button>
          )}
          {user.relationship_status === 'request_sent' && (
            <Button size="sm" variant="outline" disabled>
              تم الإرسال
            </Button>
          )}
          {user.relationship_status === 'friend' && (
            <Button size="sm" variant="outline" disabled>
              صديق
            </Button>
          )}
        </div>
      </div>
      
      {/* Interests */}
      {user.interests && user.interests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {user.interests.slice(0, 3).map((interest, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {interest}
            </span>
          ))}
          {user.interests.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{user.interests.length - 3} مزيد
            </span>
          )}
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ابحث عن الأصدقاء بالاسم أو اسم المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="ml-1 h-4 w-4" />
                فلاتر متقدمة
              </Button>
              
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                  جاري البحث...
                </div>
              )}
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">العمر الأدنى</label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={filters.minAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                    className="text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">العمر الأقصى</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={filters.maxAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">الموقع</label>
                  <Input
                    placeholder="الرياض, جدة, القاهرة..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="text-right"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">نتائج البحث ({searchResults.length})</h3>
          {searchResults.map((user) => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </div>
      )}

      {/* Friend Suggestions */}
      {suggestions.length > 0 && searchResults.length === 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">أصدقاء مقترحون</h3>
          </div>
          <p className="text-sm text-gray-600">أشخاص قد تعرفهم بناءً على اهتماماتكم المشتركة</p>
          {suggestions.map((user) => (
            <UserCard key={user.user_id} user={user} showDismiss={true} />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={loadFriendSuggestions}
            className="w-full"
          >
            تحديث الاقتراحات
          </Button>
        </div>
      )}

      {/* Empty State */}
      {searchQuery && searchResults.length === 0 && !loading && (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-gray-600">جرب بحثاً مختلفاً أو استخدم الفلاتر</p>
        </div>
      )}
    </div>
  )
}

export default UserSearchPanel