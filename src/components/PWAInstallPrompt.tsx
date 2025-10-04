import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface PWAInstallPromptProps {
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // التحقق من وجود التطبيق مثبت مسبقاً
    const checkIfInstalled = () => {
      // في حالة Safari على iOS
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        return;
      }
      
      // في حالة Chrome/Edge
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // التحقق من localStorage للحالات الأخرى
      const wasInstalled = localStorage.getItem('pwa-installed');
      if (wasInstalled === 'true') {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // الاستماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('💡 يمكن تثبيت التطبيق الآن');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // عرض البانر بعد 3 ثوان إذا لم يكن التطبيق مثبت
      if (!isInstalled) {
        setTimeout(() => {
          const dismissed = localStorage.getItem('install-banner-dismissed');
          if (!dismissed) {
            setShowInstallBanner(true);
          }
        }, 3000);
      }
    };

    // الاستماع لحدث appinstalled
    const handleAppInstalled = () => {
      console.log('🎉 تم تثبيت التطبيق بنجاح');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      
      // إظهار رسالة نجح التثبيت
      showSuccessMessage();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // في حالة عدم وجود prompt، عرض تعليمات يدوية
      showManualInstallInstructions();
      return;
    }

    setIsInstalling(true);

    try {
      // عرض prompt التثبيت
      await deferredPrompt.prompt();
      
      // انتظار قرار المستخدم
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`🔔 المستخدم ${outcome === 'accepted' ? 'وافق' : 'رفض'} تثبيت التطبيق`);
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-installed', 'true');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ فشل في تثبيت التطبيق:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
    
    // إعادة عرض البانر بعد 24 ساعة
    setTimeout(() => {
      localStorage.removeItem('install-banner-dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  const showSuccessMessage = () => {
    // يمكن استخدام toast notification هنا
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    message.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>تم تثبيت التطبيق بنجاح! 🎉</span>
      </div>
    `;
    
    document.body.appendChild(message);
    
    // تأثير الظهور
    setTimeout(() => {
      message.classList.remove('translate-x-full');
    }, 100);
    
    // إخفاء الرسالة بعد 4 ثوان
    setTimeout(() => {
      message.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(message);
      }, 300);
    }, 4000);
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4">تثبيت التطبيق على iOS</h3>
          <div class="space-y-3 text-sm text-gray-600">
            <p>1. اضغط على زر المشاركة <span class="inline-block">📤</span> في Safari</p>
            <p>2. مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"</p>
            <p>3. اضغط "إضافة" لتثبيت التطبيق</p>
          </div>
        </div>
      `;
    } else if (isAndroid) {
      instructions = `
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4">تثبيت التطبيق على Android</h3>
          <div class="space-y-3 text-sm text-gray-600">
            <p>1. اضغط على القائمة ⋮ في Chrome</p>
            <p>2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</p>
            <p>3. اضغط "تثبيت" لإضافة التطبيق</p>
          </div>
        </div>
      `;
    } else {
      instructions = `
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4">تثبيت التطبيق</h3>
          <div class="space-y-3 text-sm text-gray-600">
            <p>1. اضغط على أيقونة التثبيت في شريط العنوان</p>
            <p>2. أو ابحث عن "تثبيت" في قائمة المتصفح</p>
            <p>3. اتبع التعليمات لإكمال التثبيت</p>
          </div>
        </div>
      `;
    }
    
    // إظهار modal مع التعليمات
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        ${instructions}
        <button onclick="this.parentElement.parentElement.remove()" 
                class="mt-6 w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">
          فهمت
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  };

  // إذا كان التطبيق مثبت، لا تعرض أي شيء
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* زر التثبيت المدمج */}
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors ${className}`}
      >
        {isInstalling ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            جاري التثبيت...
          </>
        ) : (
          <>
            <Download size={16} />
            تثبيت التطبيق
          </>
        )}
      </button>

      {/* بانر التثبيت */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 shadow-lg z-50 transform transition-all duration-300">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-semibold">احصل على تجربة أفضل</h4>
                <p className="text-sm opacity-90">ثبت تطبيق ZOPLP ADS للوصول السريع والإشعارات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isInstalling ? 'جاري التثبيت...' : 'تثبيت'}
              </button>
              <button
                onClick={handleDismissBanner}
                className="bg-white bg-opacity-10 hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
