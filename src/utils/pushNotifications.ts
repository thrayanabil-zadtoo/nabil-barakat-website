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
  configuredBackendUrl?: string;
  isSameOriginBackend?: boolean;
  hasPersistentVapidEnv?: boolean;
}

const PUSH_BACKEND_STORAGE_KEY = 'nabil_push_api_base_url';

let syncInFlight: Promise<PushSubscription | null> | null = null;
let cachedBaseUrl: string | null | undefined;
let cachedCloudBackendUrl: string | null | undefined;

function normalizeBaseUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim().replace(/\/+$/, '');
  if (!clean) return '';
  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return '';
    }
    return parsed.origin;
  } catch {
    return '';
  }
}

export function getConfiguredPushApiBaseUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PUSH_BACKEND_STORAGE_KEY);
      const norm = normalizeBaseUrl(stored);
      if (norm) return norm;
    }
  } catch {
    // ignore
  }

  if (cachedCloudBackendUrl) {
    return cachedCloudBackendUrl;
  }

  try {
    const envBase = (import.meta as any)?.env?.VITE_PUSH_API_BASE_URL;
    const normEnv = normalizeBaseUrl(envBase);
    if (normEnv) return normEnv;
  } catch {
    // ignore
  }

  return '';
}

async function resolveExternalPushBaseFromCloud(): Promise<string> {
  const localOrEnv = getConfiguredPushApiBaseUrl();
  if (localOrEnv) return localOrEnv;

  if (cachedCloudBackendUrl !== undefined) {
    return cachedCloudBackendUrl || '';
  }

  try {
    const snap = await getDoc(doc(db, 'push_config', 'backend'));
    if (snap.exists()) {
      const norm = normalizeBaseUrl(snap.data()?.apiBaseUrl);
      cachedCloudBackendUrl = norm || null;
      if (norm) {
        try {
          localStorage.setItem(PUSH_BACKEND_STORAGE_KEY, norm);
        } catch {
          // ignore
        }
        return norm;
      }
    } else {
      cachedCloudBackendUrl = null;
    }
  } catch {
    cachedCloudBackendUrl = null;
  }

  return '';
}

export async function saveConfiguredPushApiBaseUrl(rawUrl: string): Promise<{
  success: boolean;
  normalizedUrl: string;
  reachable: boolean;
  message: string;
}> {
  const trimmed = (rawUrl || '').trim();
  const normalizedUrl = normalizeBaseUrl(trimmed);

  if (trimmed && !normalizedUrl) {
    return {
      success: false,
      normalizedUrl: '',
      reachable: false,
      message: 'الرابط غير صالح. يجب أن يبدأ بـ https:// مثل: https://your-push-server.vercel.app',
    };
  }

  // Test reachability before saving if non-empty
  if (normalizedUrl) {
    try {
      const testRes = await fetch(`${normalizedUrl}/api/push/status`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const ct = testRes.headers.get('content-type') || '';
      if (!testRes.ok || !ct.includes('application/json')) {
        return {
          success: false,
          normalizedUrl,
          reachable: false,
          message: 'الخادم عند هذا الرابط لم يستجب لـ /api/push/status — تأكد من نشر الخادم أولاً.',
        };
      }
      const data = await testRes.json().catch(() => null);
      if (!data?.enabled) {
        return {
          success: false,
          normalizedUrl,
          reachable: false,
          message: 'الرابط استجاب ولكن خدمة الإشعارات غير مفعلة عليه.',
        };
      }
    } catch {
      return {
        success: false,
        normalizedUrl,
        reachable: false,
        message: 'تعذر الاتصال بهذا الرابط. تأكد من صحة عنوان الخادم وأنه يعمل.',
      };
    }
  }

  try {
    if (normalizedUrl) {
      localStorage.setItem(PUSH_BACKEND_STORAGE_KEY, normalizedUrl);
    } else {
      localStorage.removeItem(PUSH_BACKEND_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  cachedCloudBackendUrl = normalizedUrl || null;
  cachedBaseUrl = undefined;

  try {
    await setDoc(
      doc(db, 'push_config', 'backend'),
      {
        apiBaseUrl: normalizedUrl || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // non-fatal
  }

  return {
    success: true,
    normalizedUrl,
    reachable: Boolean(normalizedUrl),
    message: normalizedUrl
      ? '✓ تم ربط خادم الإشعارات وحفظه سحابياً لجميع الزوار بنجاح!'
      : 'تم مسح رابط خادم الإشعارات الخارجي.',
  };
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
      if (contentType.includes('application/json')) {
        return res;
      }
      return null;
    } catch {
      return null;
    }
  };

  if (cachedBaseUrl !== undefined && cachedBaseUrl !== null) {
    const cachedRes = await tryBase(cachedBaseUrl);
    if (cachedRes) return cachedRes;
    cachedBaseUrl = undefined;
  }

  // 1. Try same-origin /api/push/... first (works natively on Node / Cloud Run / Vercel)
  const sameOriginRes = await tryBase('');
  if (sameOriginRes) {
    cachedBaseUrl = '';
    return sameOriginRes;
  }

  // 2. Fallback to configured external push API URL (saved in Firestore / localStorage / env)
  const externalBase = await resolveExternalPushBaseFromCloud();
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

  const subJson = sub.toJSON();
  const res = await fetchPushApi('/api/push/send', {
    method: 'POST',
    body: JSON.stringify({
      kind: 'test',
      title: 'اختبار ناجح لإشعارات الخلفية — أ. نبيل بركات',
      body: 'تعمل إشعارات Web Push بنجاح! ستصل منشوراتك الجديدة للقراء حتى لو كان التطبيق مغلقاً.',
      url: '/?section=community',
      targetEndpoint: sub.endpoint,
      subscription:
        subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth
          ? {
              endpoint: subJson.endpoint,
              keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
              expirationTime: subJson.expirationTime ?? null,
            }
          : undefined,
    }),
  });

  if (!res) {
    return {
      success: false,
      message: 'تعذر الوصول إلى خادم الإشعارات من هذا النطاق الحالي (الاستضافة ثابتة ولم يتم ربط خادم إرسال بعد).',
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
  let hasPersistentVapidEnv: boolean | undefined;

  const statusRes = await fetchPushApi('/api/push/status');
  if (statusRes && statusRes.ok) {
    try {
      const data = await statusRes.json();
      if (data?.enabled) {
        backendReachable = true;
        subscriberCount = Number(data?.subscriberCount || 0);
        if (typeof data?.hasPersistentVapidEnv === 'boolean') {
          hasPersistentVapidEnv = data.hasPersistentVapidEnv;
        }
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

  const configuredBackendUrl = (await resolveExternalPushBaseFromCloud()) || '';

  return {
    supported,
    permission,
    backendReachable,
    subscriberCount,
    currentDeviceSubscribed,
    currentEndpoint,
    configuredBackendUrl,
    isSameOriginBackend: cachedBaseUrl === '',
    hasPersistentVapidEnv,
  };
}

/**
 * Generates a standard Web Push VAPID keypair (P-256) directly inside the supervisor's browser
 * so keys can be copied into Vercel/Render/Cloud Run Environment Variables even from a phone.
 */
export async function generateBrowserVapidKeys(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('المتصفح الحالي لا يدعم التوليد المحلي لمفاتيح التشفير.');
  }

  const base64UrlToBytes = (b64u: string): Uint8Array => {
    const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
    const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  };

  const pad32 = (bytes: Uint8Array): Uint8Array => {
    if (bytes.length === 32) return bytes;
    const out = new Uint8Array(32);
    out.set(bytes.slice(-32), Math.max(0, 32 - bytes.length));
    return out;
  };

  const bytesToBase64Url = (bytes: Uint8Array): string => {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const kp = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const jwk = await window.crypto.subtle.exportKey('jwk', kp.privateKey);
  if (!jwk.x || !jwk.y || !jwk.d) {
    throw new Error('تعذر استخراج مفاتيح VAPID.');
  }

  const x = pad32(base64UrlToBytes(jwk.x));
  const y = pad32(base64UrlToBytes(jwk.y));
  const d = pad32(base64UrlToBytes(jwk.d));

  const pubBytes = new Uint8Array(65);
  pubBytes[0] = 0x04;
  pubBytes.set(x, 1);
  pubBytes.set(y, 33);

  return {
    publicKey: bytesToBase64Url(pubBytes),
    privateKey: bytesToBase64Url(d),
  };
}

