import { useEffect, useState, useCallback } from 'react';
import { getSiteBaseUrl } from '../config/siteDomain';
import { syncWebPushSubscription } from '../utils/pushNotifications';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export const OPEN_PWA_INSTALL_EVENT = 'open-pwa-install-dialog';
const WELCOME_NOTIF_SHOWN_KEY = 'nabil_barakat_welcome_notif_v1';

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
let globalNotificationPermission: NotificationPermissionState = getCurrentNotificationPermission();
let standaloneAutoPromptAttempted = false;
let notificationRequestInFlight: Promise<NotificationPermissionState> | null = null;
const listeners = new Set<() => void>();
let initialized = false;

function getCurrentNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function checkStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function detectInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|TikTok|BytedanceWebview|wv\b/i.test(ua);
}

function detectEmbeddedIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function showInstalledWelcomeNotification() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if (localStorage.getItem(WELCOME_NOTIF_SHOWN_KEY) === '1') return;
    localStorage.setItem(WELCOME_NOTIF_SHOWN_KEY, '1');
  } catch {
    // ignore storage errors
  }

  const title = 'أهلاً بك في تطبيق الكاتب أ. نبيل بركات';
  const options: NotificationOptions = {
    body: 'تم تفعيل إذن الإشعارات تلقائياً لتصلك أحدث القصائد والخواطر والإصدارات.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: 'nabil-barakat-welcome',
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch {
    // ignore browser notification restrictions
  }
}

export async function requestNotificationsOnInstall(
  options: { showWelcomeNotification?: boolean } = {}
): Promise<NotificationPermissionState> {
  const { showWelcomeNotification = true } = options;

  if (typeof window === 'undefined' || !('Notification' in window)) {
    globalNotificationPermission = 'unsupported';
    notifyListeners();
    return 'unsupported';
  }

  const current = getCurrentNotificationPermission();
  if (current === 'granted') {
    globalNotificationPermission = 'granted';
    notifyListeners();
    void syncWebPushSubscription();
    if (showWelcomeNotification) {
      void showInstalledWelcomeNotification();
    }
    return 'granted';
  }

  if (current === 'denied') {
    globalNotificationPermission = 'denied';
    notifyListeners();
    return 'denied';
  }

  if (notificationRequestInFlight) {
    return notificationRequestInFlight;
  }

  notificationRequestInFlight = (async () => {
    try {
      const result = (await Notification.requestPermission()) as NotificationPermissionState;
      globalNotificationPermission = result;
      notifyListeners();
      if (result === 'granted') {
        void syncWebPushSubscription();
        if (showWelcomeNotification) {
          void showInstalledWelcomeNotification();
        }
      }
      return result;
    } catch {
      globalNotificationPermission = getCurrentNotificationPermission();
      notifyListeners();
      return globalNotificationPermission;
    } finally {
      notificationRequestInFlight = null;
    }
  })();

  return notificationRequestInFlight;
}

function ensureGlobalListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Pick up any beforeinstallprompt fired before React hydration
  const earlyPrompt = (window as unknown as { __DEFERRED_INSTALL_PROMPT__?: BeforeInstallPromptEvent }).__DEFERRED_INSTALL_PROMPT__;
  if (earlyPrompt && !globalDeferredPrompt) {
    globalDeferredPrompt = earlyPrompt;
  }

  globalIsInstalled = checkStandaloneMode();
  globalNotificationPermission = getCurrentNotificationPermission();

  // Auto-upgrade any existing device with granted notification permission into a real background Web Push subscription
  if (globalNotificationPermission === 'granted') {
    void syncWebPushSubscription();
  }

  // Detect if the PWA is already installed on Android/Desktop Chrome even when opened in a normal browser tab
  const navWithRelated = navigator as unknown as {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; url?: string }>>;
  };
  if (!globalIsInstalled && typeof navWithRelated.getInstalledRelatedApps === 'function') {
    navWithRelated
      .getInstalledRelatedApps()
      .then((apps) => {
        if (Array.isArray(apps) && apps.length > 0) {
          globalIsInstalled = true;
          notifyListeners();
        }
      })
      .catch(() => {});
  }

  // If opened inside the installed standalone PWA and notifications aren't granted yet, automatically request permission
  if (globalIsInstalled && globalNotificationPermission === 'default' && !standaloneAutoPromptAttempted) {
    standaloneAutoPromptAttempted = true;
    setTimeout(() => {
      void requestNotificationsOnInstall({ showWelcomeNotification: true });
    }, 600);

    // Fallback for browsers (e.g. Android Chrome WebAPK) that require a user gesture to display the permission dialog
    const handleFirstStandaloneGesture = () => {
      if (getCurrentNotificationPermission() === 'default') {
        void requestNotificationsOnInstall({ showWelcomeNotification: true });
      }
      window.removeEventListener('pointerdown', handleFirstStandaloneGesture);
      window.removeEventListener('keydown', handleFirstStandaloneGesture);
    };
    window.addEventListener('pointerdown', handleFirstStandaloneGesture, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstStandaloneGesture, { passive: true, once: true });
  }

  // Keep permission state synced when changed from Android System Settings or browser site settings
  if (navigator.permissions && typeof navigator.permissions.query === 'function') {
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        status.onchange = () => {
          globalNotificationPermission = getCurrentNotificationPermission();
          notifyListeners();
          if (globalNotificationPermission === 'granted') {
            void syncWebPushSubscription();
          }
        };
      })
      .catch(() => {});
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    (window as unknown as { __DEFERRED_INSTALL_PROMPT__?: BeforeInstallPromptEvent }).__DEFERRED_INSTALL_PROMPT__ =
      globalDeferredPrompt;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    delete (window as unknown as { __DEFERRED_INSTALL_PROMPT__?: BeforeInstallPromptEvent }).__DEFERRED_INSTALL_PROMPT__;
    notifyListeners();
    // Automatically request notification permission immediately upon PWA installation
    void requestNotificationsOnInstall({ showWelcomeNotification: true });
  });

  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        globalIsInstalled = true;
        globalDeferredPrompt = null;
        notifyListeners();
        if (getCurrentNotificationPermission() === 'default') {
          void requestNotificationsOnInstall({ showWelcomeNotification: true });
        }
      }
    });
  }
}

if (typeof window !== 'undefined') {
  ensureGlobalListeners();
}

export function openPWAInstallDialog() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_PWA_INSTALL_EVENT));
  }
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS] = useState<boolean>(() => detectIOSDevice());
  const [isInAppBrowser] = useState<boolean>(() => detectInAppBrowser());
  const [isEmbeddedIframe] = useState<boolean>(() => detectEmbeddedIframe());

  useEffect(() => {
    ensureGlobalListeners();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    // Sync initial state on mount & re-check early captured beforeinstallprompt
    const earlyPrompt = (window as unknown as { __DEFERRED_INSTALL_PROMPT__?: BeforeInstallPromptEvent }).__DEFERRED_INSTALL_PROMPT__;
    if (earlyPrompt && !globalDeferredPrompt) {
      globalDeferredPrompt = earlyPrompt;
    }
    if (checkStandaloneMode()) {
      globalIsInstalled = true;
    }
    globalNotificationPermission = getCurrentNotificationPermission();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const installNative = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!globalDeferredPrompt) {
      return 'unavailable';
    }
    try {
      await globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      globalDeferredPrompt = null;
      if (choice.outcome === 'accepted') {
        globalIsInstalled = true;
        // Request notification permission automatically as part of install completion
        void requestNotificationsOnInstall({ showWelcomeNotification: true });
      }
      notifyListeners();
      return choice.outcome;
    } catch {
      globalDeferredPrompt = null;
      notifyListeners();
      return 'unavailable';
    }
  }, []);

  const requestNotifications = useCallback(async () => {
    return requestNotificationsOnInstall({ showWelcomeNotification: true });
  }, []);

  const triggerInstall = useCallback(async () => {
    if (globalIsInstalled || checkStandaloneMode()) {
      if (getCurrentNotificationPermission() === 'default') {
        await requestNotificationsOnInstall({ showWelcomeNotification: true });
      }
      openPWAInstallDialog();
      return;
    }

    if (globalDeferredPrompt) {
      const result = await installNative();
      if (result === 'accepted') {
        return;
      }
    }

    openPWAInstallDialog();
  }, [installNative]);

  return {
    isInstallable: Boolean(globalDeferredPrompt),
    isInstalled: globalIsInstalled,
    isIOS,
    isInAppBrowser,
    isEmbeddedIframe,
    notificationPermission: globalNotificationPermission,
    siteUrl: getSiteBaseUrl(),
    installNative,
    triggerInstall,
    requestNotifications,
    openInstallDialog: openPWAInstallDialog,
  };
}
