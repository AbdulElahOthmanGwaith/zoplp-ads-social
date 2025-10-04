import React from 'react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Play, Pause, Upload, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface VoiceCommentRecorderProps {
  postId: string
  onCommentAdded: () => void
  onCancel: () => void
}

const VoiceCommentRecorder: React.FC<VoiceCommentRecorderProps> = ({
  postId,
  onCommentAdded,
  onCancel
}) => {
  const {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    uploadVoiceComment,
    clearRecording
  } = useVoiceRecorder()

  const [isPlaying, setIsPlaying] = React.useState(false)
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null)
  const [uploading, setUploading] = React.useState(false)

  // Create audio preview
  React.useEffect(() => {
    if (audioBlob && !audioElement) {
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.addEventListener('ended', () => setIsPlaying(false))
      setAudioElement(audio)
      
      return () => {
        URL.revokeObjectURL(url)
        audio.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [audioBlob])

  const togglePlayback = () => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      audioElement.play()
      setIsPlaying(true)
    }
  }

  const handleUpload = async () => {
    if (!audioBlob) {
      toast.error('لم يتم العثور على تسجيل صوتي')
      return
    }

    setUploading(true)
    try {
      await uploadVoiceComment(postId)
      onCommentAdded()
      toast.success('تم إرسال التعليق الصوتي بنجاح')
    } catch (error) {
      console.error('Error uploading voice comment:', error)
      toast.error('فشل في إرسال التعليق الصوتي')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (audioElement) {
      audioElement.pause()
      setIsPlaying(false)
    }
    clearRecording()
    onCancel()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900">تعليق صوتي</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4 space-x-reverse">
            {!audioBlob ? (
              <>
                {/* Recording Button */}
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  className={`rounded-full w-16 h-16 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </Button>
                
                {/* Recording Duration */}
                {isRecording && (
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-red-600">
                      {formatTime(recordingDuration)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {recordingDuration >= 60 ? 'وصلت للحد الأقصى' : 'جاري التسجيل...'}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Playback Controls */}
                <Button
                  onClick={togglePlayback}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <div className="flex-1 space-y-2">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatTime(recordingDuration)}</div>
                    <div className="text-sm text-gray-600">تسجيل جاهز للإرسال</div>
                  </div>
                  
                  {/* Waveform Placeholder */}
                  <div className="bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`bg-blue-500 h-full rounded-full transition-all duration-200 ${
                        isPlaying ? 'animate-pulse' : ''
                      }`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {audioBlob && (
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => {
                  clearRecording()
                  if (audioElement) {
                    audioElement.pause()
                    setIsPlaying(false)
                  }
                  setAudioElement(null)
                }}
              >
                حذف
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    إرسال
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Instructions */}
          {!isRecording && !audioBlob && (
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>اضغط على الزر لبدء التسجيل</p>
              <p>الحد الأقصى: 60 ثانية</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default VoiceCommentRecorder