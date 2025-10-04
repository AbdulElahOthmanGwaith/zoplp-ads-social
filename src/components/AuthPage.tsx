import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

const AuthPage: React.FC = () => {
  const { signIn, signUp, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(signInData.email, signInData.password)
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('كلمات المرور غير متطابقة')
      return
    }

    setIsLoading(true)
    try {
      await signUp(
        signUpData.email,
        signUpData.password,
        {
          full_name: signUpData.fullName,
          username: signUpData.username
        }
      )
    } catch (error) {
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-600">ZOPLP ADS</h1>
          <p className="text-gray-600">منصة التواصل الاجتماعي الآمنة</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">تسجيل الدخول</CardTitle>
                <CardDescription className="text-right">
                  ادخل بياناتك للدخول إلى حسابك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right block">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-right block">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الدخول...
                      </>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">إنشاء حساب جديد</CardTitle>
                <CardDescription className="text-right">
                  انضم إلى مجتمعنا الآمن
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-right block">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-right block">اسم المستخدم</Label>
                    <Input
                      id="username"
                      type="text"
                      value={signUpData.username}
                      onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-right block">البريد الإلكتروني</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-right block">كلمة المرور</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-right block">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                      className="text-right"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      'إنشاء الحساب'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AuthPage