import { useEffect, useState, useCallback } from 'react';
import { getSiteBaseUrl } from '../config/siteDomain';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

export const OPEN_PWA_INSTALL_EVENT = 'open-pwa-install-dialog';

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
const listeners = new Set<() => void>();
let initialized = false;

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

function ensureGlobalListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  globalIsInstalled = checkStandaloneMode();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    notifyListeners();
  });

  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        globalIsInstalled = true;
        globalDeferredPrompt = null;
        notifyListeners();
      }
    });
  }
}

export function openPWAInstallDialog() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_PWA_INSTALL_EVENT));
  }
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS] = useState<boolean>(() => detectIOSDevice());

  useEffect(() => {
    ensureGlobalListeners();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    // Sync initial state on mount
    globalIsInstalled = checkStandaloneMode();
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
      }
      notifyListeners();
      return choice.outcome;
    } catch {
      globalDeferredPrompt = null;
      notifyListeners();
      return 'unavailable';
    }
  }, []);

  const triggerInstall = useCallback(async () => {
    if (globalIsInstalled || checkStandaloneMode()) {
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
    siteUrl: getSiteBaseUrl(),
    installNative,
    triggerInstall,
    openInstallDialog: openPWAInstallDialog,
  };
}
