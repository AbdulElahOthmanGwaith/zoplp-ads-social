import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export const useMediaUpload = () => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const uploadMedia = useCallback(async (file: File, type: 'avatar' | 'post-media' = 'post-media') => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لرفع الملفات')
      throw new Error('User not authenticated')
    }

    // Validate file size
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 50 * 1024 * 1024 // 5MB for avatar, 50MB for post media
    if (file.size > maxSize) {
      toast.error(`حجم الملف يتجاوز ${maxSize / (1024 * 1024)}MB`)
      throw new Error('File size too large')
    }

    setUploading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      return new Promise<string>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string
            const fileName = file.name

            // Use appropriate edge function
            const functionName = type === 'avatar' ? 'upload-avatar' : 'upload-media'
            
            const { data, error } = await supabase.functions.invoke(functionName, {
              body: {
                imageData: base64Data,
                fileName,
                mediaType: file.type.startsWith('video') ? 'video' : 'image'
              }
            })

            if (error) {
              console.error('Media upload error:', error)
              throw error
            }

            toast.success('تم رفع الملف بنجاح')
            resolve(data.data.publicUrl)
          } catch (error) {
            reject(error)
          } finally {
            setUploading(false)
          }
        }
        
        reader.onerror = () => {
          setUploading(false)
          reject(new Error('Failed to read file'))
        }
      })
    } catch (error) {
      setUploading(false)
      console.error('Error uploading media:', error)
      toast.error('فشل في رفع الملف')
      throw error
    }
  }, [user])

  return {
    uploadMedia,
    uploading
  }
}