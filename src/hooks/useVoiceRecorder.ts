import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export const useVoiceRecorder = () => {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingDuration(0)

      // Start duration counter
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) { // Max 60 seconds
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
      setRecordingInterval(interval)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('فشل في بدء التسجيل. يرجى السماح بالوصول للميكروفون.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval)
      setRecordingInterval(null)
    }
    
    setIsRecording(false)
    setMediaRecorder(null)
  }

  const uploadVoiceComment = async (postId: string) => {
    if (!audioBlob || !user) {
      toast.error('لم يتم العثور على تسجيل صوتي')
      return
    }

    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      
      return new Promise<string>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string
            const fileName = `voice-comment-${Date.now()}.webm`

            // Upload via edge function
            const { data, error } = await supabase.functions.invoke('upload-voice-comment', {
              body: {
                audioData: base64Data,
                fileName,
                postId,
                duration: recordingDuration
              }
            })

            if (error) {
              console.error('Voice comment upload error:', error)
              throw error
            }

            toast.success('تم إرسال التعليق الصوتي بنجاح')
            
            // Clear recording
            setAudioBlob(null)
            setRecordingDuration(0)
            
            resolve(data.data.audioUrl)
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = reject
      })
    } catch (error) {
      console.error('Error uploading voice comment:', error)
      toast.error('فشل في رفع التعليق الصوتي')
      throw error
    }
  }

  const clearRecording = () => {
    setAudioBlob(null)
    setRecordingDuration(0)
  }

  return {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    uploadVoiceComment,
    clearRecording
  }
}