import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type PushBroadcastKind =
  | 'post'
  | 'book'
  | 'video'
  | 'photo'
  | 'news'
  | 'announcement'
  | 'link';

export interface PushSendPayload {
  kind: PushBroadcastKind;
  itemId: string;
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
}

export interface PushBackendDiagnostics {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  backendReachable: boolean;
  subscriberCount: number;
  currentDeviceSubscribed: boolean;
  currentEndpoint?: string;
}

let syncInFlight: Promise<PushSubscription | null> | null = null;
let cachedBaseUrl: string | null | undefined;

function getOptionalExternalPushBase(): string {
  try {
    const envBase = (import.meta as any)?.env?.VITE_PUSH_API_BASE_URL;
    if (typeof envBase === 'string' && envBase.trim()) {
      return envBase.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return '';
}

async function fetchPushApi(path: string, init?: RequestInit): Promise<Response | null> {
  const tryBase = async (base: string): Promise<Response | null> => {
    try {
      const res = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return res;
      }
      if (!res.ok && contentType.includes('application/json')) {
        return res;
      }
      return null;
    } catch {
      return null;
    }
  };

  if (cachedBaseUrl !== undefined && cachedBaseUrl !== null) {
    return tryBase(cachedBaseUrl);
  }

  // 1. Try same-origin /api/push/... first
  const sameOriginRes = await tryBase('');
  if (sameOriginRes) {
    cachedBaseUrl = '';
    return sameOriginRes;
  }

  // 2. Optional external push API URL fallback (for static-only domain mirrors)
  const externalBase = getOptionalExternalPushBase();
  if (externalBase) {
    const extRes = await tryBase(externalBase);
    if (extRes) {
      cachedBaseUrl = externalBase;
      return extRes;
    }
  }

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null | undefined): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashEndpointToDocId(endpoint: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      const data = new TextEncoder().encode(endpoint);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32);
    }
  } catch {
    // fallback below
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < endpoint.length; i++) {
    const ch = endpoint.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x01000193);
  }
  return `sub_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetchPushApi('/api/push/vapid-public-key');
  if (res && res.ok) {
    try {
      const data = await res.json();
      if (data?.publicKey && typeof data.publicKey === 'string') {
        return data.publicKey;
      }
    } catch {
      // ignore
    }
  }

  // Fallback to Firestore push_config/vapid
  try {
    const snap = await getDoc(doc(db, 'push_config', 'vapid'));
    if (snap.exists()) {
      const key = snap.data()?.publicKey;
      if (typeof key === 'string' && key.trim()) {
        return key.trim();
      }
    }
  } catch {
    // ignore
  }

  return null;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

async function persistSubscriptionEverywhere(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const endpoint = json.endpoint || sub.endpoint;
  const p256dh = json.keys?.p256dh || '';
  const auth = json.keys?.auth || '';
  if (!endpoint || !p256dh || !auth) return;

  const isStandalone = detectStandalone();
  const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '').slice(0, 220) : '';

  // 1. Send to backend push server
  void fetchPushApi('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      subscription: {
        endpoint,
        expirationTime: json.expirationTime ?? null,
        keys: { p256dh, auth },
      },
      isStandalone,
      userAgent,
    }),
  });

  // 2. Also persist directly to Firestore push_subscriptions collection
  try {
    const subId = await hashEndpointToDocId(endpoint);
    const now = new Date().toISOString();
    await setDoc(
      doc(db, 'push_subscriptions', subId),
      {
        id: subId,
        endpoint,
        p256dh,
        auth,
        expirationTime: json.expirationTime ?? null,
        isStandalone,
        userAgent,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch {
    // non-fatal if backend already stored it
  }
}

/**
 * Registers or upgrades the current browser/PWA PushSubscription when Notification.permission === 'granted'.
 * Safe to call repeatedly on app load and immediately after permission grant.
 */
export async function syncWebPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration?.pushManager) return null;

      const serverPublicKey = await fetchVapidPublicKey();
      let existing = await registration.pushManager.getSubscription();

      if (existing && serverPublicKey) {
        const existingKey = arrayBufferToBase64Url(existing.options?.applicationServerKey);
        if (existingKey && existingKey !== serverPublicKey) {
          // Server VAPID key rotated or updated — cleanly resubscribe
          try {
            await existing.unsubscribe();
          } catch {
            // ignore
          }
          existing = null;
        }
      }

      if (!existing && serverPublicKey) {
        const applicationServerKey = urlBase64ToUint8Array(serverPublicKey);
        existing = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });
      }

      if (existing) {
        await persistSubscriptionEverywhere(existing);
      }

      return existing;
    } catch (err) {
      console.warn('[WebPush] Subscription sync notice:', err);
      return null;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

/**
 * Broadcasts a real Web Push notification through the backend server to all subscribed devices
 * (delivered even when recipients' installed PWA app is completely closed).
 */
export async function broadcastWebPushForContent(payload: PushSendPayload): Promise<{
  sentCount: number;
  totalSubscribers: number;
  backendReachable: boolean;
}> {
  try {
    const res = await fetchPushApi('/api/push/send', {
      method: 'POST',
      body: JSON.stringify({
        kind: payload.kind,
        itemId: payload.itemId,
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        image: payload.image,
        tag: payload.tag || `nabil-${payload.kind}-${payload.itemId}`,
      }),
    });

    if (!res) {
      return { sentCount: 0, totalSubscribers: 0, backendReachable: false };
    }

    const data = await res.json().catch(() => ({}));
    return {
      sentCount: Number(data?.sentCount || 0),
      totalSubscribers: Number(data?.totalSubscribers || 0),
      backendReachable: true,
    };
  } catch {
    return { sentCount: 0, totalSubscribers: 0, backendReachable: false };
  }
}

/**
 * Sends a real background Web Push test notification strictly to the supervisor's own device.
 */
export async function sendTestPushToCurrentDevice(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isWebPushSupported()) {
    return {
      success: false,
      message: 'هذا المتصفح لا يدعم إشعارات الدفع في الخلفية (Web Push).',
    };
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'يرجى السماح بإذن الإشعارات من إعدادات المتصفح أولاً.',
      };
    }
  }

  const sub = await syncWebPushSubscription();
  if (!sub) {
    return {
      success: false,
      message: 'تعذر إنشاء اشتراك الإشعارات لهذا الجهاز. تأكد من فتح الموقع عبر رابط الخادم HTTPS.',
    };
  }

  const res = await fetchPushApi('/api/push/send', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'test',
      title: 'اختبار ناجح لإشعارات الخلفية — أ. نبيل بركات',
      body: 'تعمل إشعارات Web Push بنجاح! ستصل منشوراتك الجديدة للقراء حتى لو كان التطبيق مغلقاً.',
      url: '/?section=community',
      targetEndpoint: sub.endpoint,
    }),
  });

  if (!res) {
    return {
      success: false,
      message: 'تعذر الوصول إلى خادم الإشعارات من هذا النطاق الحالي.',
    };
  }

  const data = await res.json().catch(() => ({}));
  if (data?.success && data?.sentCount > 0) {
    return {
      success: true,
      message: '✓ تم إرسال إشعار تجريبي حقيقي عبر خادم Web Push إلى جهازك!',
    };
  }

  return {
    success: false,
    message: data?.skippedReason || data?.error || 'لم يتم إرسال الإشعار التجريبي.',
  };
}

export async function getPushBackendDiagnostics(): Promise<PushBackendDiagnostics> {
  const supported = isWebPushSupported();
  const permission: NotificationPermission | 'unsupported' =
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';

  let currentEndpoint: string | undefined;
  let currentDeviceSubscribed = false;

  if (supported && permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub?.endpoint) {
        currentDeviceSubscribed = true;
        currentEndpoint = sub.endpoint;
      }
    } catch {
      // ignore
    }
  }

  let backendReachable = false;
  let subscriberCount = 0;

  const statusRes = await fetchPushApi('/api/push/status');
  if (statusRes && statusRes.ok) {
    try {
      const data = await statusRes.json();
      if (data?.enabled) {
        backendReachable = true;
        subscriberCount = Number(data?.subscriberCount || 0);
      }
    } catch {
      // ignore
    }
  }

  if (!backendReachable) {
    try {
      const snap = await getDocs(collection(db, 'push_subscriptions'));
      subscriberCount = snap.size;
    } catch {
      // ignore
    }
  }

  return {
    supported,
    permission,
    backendReachable,
    subscriberCount,
    currentDeviceSubscribed,
    currentEndpoint,
  };
}
