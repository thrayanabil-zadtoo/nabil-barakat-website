import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT_DIR, '.data');
const VAPID_FILE = path.resolve(DATA_DIR, 'vapid-keys.json');
const SUBS_CACHE_FILE = path.resolve(DATA_DIR, 'push-subscriptions.json');
const SENT_HISTORY_FILE = path.resolve(DATA_DIR, 'push-sent-history.json');

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

interface StoredVapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
  createdAt: string;
}

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: number | null;
  isStandalone?: boolean;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export type PushContentKind =
  | 'post'
  | 'book'
  | 'video'
  | 'photo'
  | 'news'
  | 'announcement'
  | 'link'
  | 'test';

export interface PushBroadcastRequest {
  kind: PushContentKind;
  itemId?: string;
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
  targetEndpoint?: string;
}

let cachedFirebaseConfig: FirebaseAppletConfig | null = null;
let cachedVapidKeys: StoredVapidKeys | null = null;
let vapidConfigured = false;
const sentTagsMemory = new Set<string>();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFirebaseConfig(): FirebaseAppletConfig | null {
  if (cachedFirebaseConfig) return cachedFirebaseConfig;
  try {
    const configPath = path.resolve(ROOT_DIR, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as FirebaseAppletConfig;
      if (parsed?.projectId && parsed?.apiKey) {
        cachedFirebaseConfig = parsed;
        return cachedFirebaseConfig;
      }
    }
  } catch (err) {
    console.warn('[WebPush] Failed to read firebase-applet-config.json:', err);
  }
  return null;
}

function getFirestoreBaseUrl(): string | null {
  const cfg = getFirebaseConfig();
  if (!cfg) return null;
  const dbId = cfg.firestoreDatabaseId || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/${encodeURIComponent(dbId)}/documents`;
}

function getFirestoreApiKeyQuery(): string {
  const cfg = getFirebaseConfig();
  return cfg?.apiKey ? `key=${encodeURIComponent(cfg.apiKey)}` : '';
}

function makeSubDocId(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

function makeSafeDocId(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

// Convert simple flat object to Firestore REST fields
function toFirestoreFields(obj: Record<string, string | number | boolean | null | undefined>) {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else {
      fields[key] = { stringValue: String(val) };
    }
  }
  return fields;
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

function fromFirestoreDoc(doc: any): Record<string, any> | null {
  if (!doc || !doc.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

async function firestoreGetDoc(docPath: string): Promise<Record<string, any> | null> {
  const baseUrl = getFirestoreBaseUrl();
  const keyQ = getFirestoreApiKeyQuery();
  if (!baseUrl || !keyQ) return null;
  try {
    const res = await fetch(`${baseUrl}/${docPath}?${keyQ}`);
    if (!res.ok) return null;
    const json = await res.json();
    return fromFirestoreDoc(json);
  } catch {
    return null;
  }
}

async function firestoreUpsertDoc(
  docPath: string,
  payload: Record<string, string | number | boolean | null | undefined>
): Promise<boolean> {
  const baseUrl = getFirestoreBaseUrl();
  const keyQ = getFirestoreApiKeyQuery();
  if (!baseUrl || !keyQ) return false;
  try {
    const res = await fetch(`${baseUrl}/${docPath}?${keyQ}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(payload) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function firestoreDeleteDoc(docPath: string): Promise<boolean> {
  const baseUrl = getFirestoreBaseUrl();
  const keyQ = getFirestoreApiKeyQuery();
  if (!baseUrl || !keyQ) return false;
  try {
    const res = await fetch(`${baseUrl}/${docPath}?${keyQ}`, {
      method: 'DELETE',
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function firestoreListCollection(collectionName: string): Promise<Record<string, any>[]> {
  const baseUrl = getFirestoreBaseUrl();
  const keyQ = getFirestoreApiKeyQuery();
  if (!baseUrl || !keyQ) return [];

  const items: Record<string, any>[] = [];
  let pageToken = '';

  try {
    for (let page = 0; page < 10; page++) {
      const tokenPart = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const res = await fetch(`${baseUrl}/${collectionName}?pageSize=300${tokenPart}&${keyQ}`);
      if (!res.ok) break;
      const json = (await res.json()) as { documents?: any[]; nextPageToken?: string };
      if (Array.isArray(json.documents)) {
        for (const d of json.documents) {
          const parsed = fromFirestoreDoc(d);
          if (parsed) items.push(parsed);
        }
      }
      if (!json.nextPageToken) break;
      pageToken = json.nextPageToken;
    }
  } catch {
    // ignore network glitch, caller merges local cache
  }
  return items;
}

function readLocalSubscriptions(): StoredPushSubscription[] {
  try {
    if (!fs.existsSync(SUBS_CACHE_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(SUBS_CACHE_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalSubscriptions(list: StoredPushSubscription[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(SUBS_CACHE_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch {
    // ignore disk errors
  }
}

function loadSentTagsFromDisk(): void {
  try {
    if (!fs.existsSync(SENT_HISTORY_FILE)) return;
    const parsed = JSON.parse(fs.readFileSync(SENT_HISTORY_FILE, 'utf8'));
    if (Array.isArray(parsed)) {
      parsed.forEach((t) => {
        if (typeof t === 'string') sentTagsMemory.add(t);
      });
    }
  } catch {
    // ignore
  }
}

function saveSentTagsToDisk(): void {
  try {
    ensureDataDir();
    const arr = Array.from(sentTagsMemory).slice(-500);
    fs.writeFileSync(SENT_HISTORY_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

loadSentTagsFromDisk();

/**
 * Ensures VAPID keypair exists (env vars -> .data/vapid-keys.json -> generate once)
 * and publishes ONLY the publicKey to Firestore push_config/vapid so any client/mirror can subscribe.
 */
export async function ensureVapidReady(): Promise<{ publicKey: string }> {
  if (!cachedVapidKeys) {
    const envPublic = process.env.VAPID_PUBLIC_KEY?.trim();
    const envPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
    const envSubject = process.env.VAPID_SUBJECT?.trim() || 'mailto:author.nabil.barakat@gmail.com';

    if (envPublic && envPrivate) {
      cachedVapidKeys = {
        publicKey: envPublic,
        privateKey: envPrivate,
        subject: envSubject,
        createdAt: new Date().toISOString(),
      };
    } else {
      try {
        if (fs.existsSync(VAPID_FILE)) {
          const parsed = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8')) as StoredVapidKeys;
          if (parsed?.publicKey && parsed?.privateKey) {
            cachedVapidKeys = parsed;
          }
        }
      } catch {
        // regenerate below if corrupted
      }

      if (!cachedVapidKeys) {
        const generated = webpush.generateVAPIDKeys();
        cachedVapidKeys = {
          publicKey: generated.publicKey,
          privateKey: generated.privateKey,
          subject: envSubject,
          createdAt: new Date().toISOString(),
        };
        try {
          ensureDataDir();
          fs.writeFileSync(VAPID_FILE, JSON.stringify(cachedVapidKeys, null, 2), { mode: 0o600 });
        } catch (err) {
          console.warn('[WebPush] Could not persist VAPID keys to .data:', err);
        }
      }
    }
  }

  if (!vapidConfigured && cachedVapidKeys) {
    webpush.setVapidDetails(
      cachedVapidKeys.subject,
      cachedVapidKeys.publicKey,
      cachedVapidKeys.privateKey
    );
    vapidConfigured = true;
    // Sync public key only (NEVER private key) to Firestore
    void firestoreUpsertDoc('push_config/vapid', {
      publicKey: cachedVapidKeys.publicKey,
      updatedAt: new Date().toISOString(),
    });
  }

  return { publicKey: cachedVapidKeys!.publicKey };
}

export async function savePushSubscription(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
  isStandalone?: boolean;
  userAgent?: string;
}): Promise<StoredPushSubscription> {
  const endpoint = (input.endpoint || '').trim();
  const p256dh = (input.keys?.p256dh || '').trim();
  const auth = (input.keys?.auth || '').trim();

  if (!endpoint.startsWith('https://') || !p256dh || !auth) {
    throw new Error('Invalid push subscription payload');
  }

  const id = makeSubDocId(endpoint);
  const now = new Date().toISOString();
  const existingLocal = readLocalSubscriptions();
  const prev = existingLocal.find((s) => s.id === id);

  const record: StoredPushSubscription = {
    id,
    endpoint,
    p256dh,
    auth,
    expirationTime: input.expirationTime ?? null,
    isStandalone: Boolean(input.isStandalone),
    userAgent: (input.userAgent || '').slice(0, 240),
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  };

  const nextLocal = [record, ...existingLocal.filter((s) => s.id !== id)];
  writeLocalSubscriptions(nextLocal);

  await firestoreUpsertDoc(`push_subscriptions/${id}`, {
    id: record.id,
    endpoint: record.endpoint,
    p256dh: record.p256dh,
    auth: record.auth,
    expirationTime: record.expirationTime ?? null,
    isStandalone: record.isStandalone,
    userAgent: record.userAgent,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });

  return record;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const clean = (endpoint || '').trim();
  if (!clean) return;
  const id = makeSubDocId(clean);

  const nextLocal = readLocalSubscriptions().filter((s) => s.id !== id && s.endpoint !== clean);
  writeLocalSubscriptions(nextLocal);
  await firestoreDeleteDoc(`push_subscriptions/${id}`);
}

export async function listPushSubscriptions(): Promise<StoredPushSubscription[]> {
  const cloudDocs = await firestoreListCollection('push_subscriptions');
  const localSubs = readLocalSubscriptions();

  const mergedMap = new Map<string, StoredPushSubscription>();

  const ingest = (raw: any) => {
    if (!raw || typeof raw.endpoint !== 'string' || !raw.p256dh || !raw.auth) return;
    if (!raw.endpoint.startsWith('https://')) return;
    const id = typeof raw.id === 'string' && raw.id ? raw.id : makeSubDocId(raw.endpoint);
    const existing = mergedMap.get(id);
    if (!existing || (raw.updatedAt && (!existing.updatedAt || raw.updatedAt > existing.updatedAt))) {
      mergedMap.set(id, {
        id,
        endpoint: raw.endpoint,
        p256dh: raw.p256dh,
        auth: raw.auth,
        expirationTime: raw.expirationTime ?? null,
        isStandalone: Boolean(raw.isStandalone),
        userAgent: typeof raw.userAgent === 'string' ? raw.userAgent : '',
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      });
    }
  };

  localSubs.forEach(ingest);
  cloudDocs.forEach(ingest);

  const merged = Array.from(mergedMap.values());
  if (merged.length > 0) {
    writeLocalSubscriptions(merged);
  }
  return merged;
}

/**
 * Verifies that a broadcast item actually exists in Firestore (prevents spoofed external spam calls).
 */
async function verifyItemExistsInFirestore(kind: PushContentKind, itemId: string): Promise<{ valid: boolean; hidden?: boolean }> {
  if (!itemId) return { valid: false };

  const findInSiteContentArray = async (docName: string, arrayField: string) => {
    const docData = await firestoreGetDoc(`site_content/${docName}`);
    if (!docData || !Array.isArray(docData[arrayField])) return null;
    return docData[arrayField].find((entry: any) => entry && entry.id === itemId) || null;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    if (kind === 'post') {
      const indiv = await firestoreGetDoc(`community_posts/${encodeURIComponent(itemId)}`);
      if (indiv) return { valid: true };
      const inAgg = await findInSiteContentArray('author_posts', 'authorPosts');
      if (inAgg) return { valid: true };
    } else if (kind === 'book') {
      const indiv = await firestoreGetDoc(`books/${encodeURIComponent(itemId)}`);
      if (indiv) {
        if (indiv.visibility === 'hidden') return { valid: false, hidden: true };
        return { valid: true };
      }
      const inAgg = await findInSiteContentArray('books', 'books');
      if (inAgg) {
        if (inAgg.visibility === 'hidden') return { valid: false, hidden: true };
        return { valid: true };
      }
    } else if (kind === 'photo') {
      const indiv = await firestoreGetDoc(`photos_gallery/${encodeURIComponent(itemId)}`);
      if (indiv) return { valid: true };
      const inAgg = await findInSiteContentArray('photos', 'photos');
      if (inAgg) return { valid: true };
    } else if (kind === 'video') {
      const inAgg = await findInSiteContentArray('videos', 'videos');
      if (inAgg) return { valid: true };
    } else if (kind === 'news') {
      const inAgg = await findInSiteContentArray('news', 'news');
      if (inAgg) return { valid: true };
    } else if (kind === 'link') {
      const inAgg = await findInSiteContentArray('links', 'links');
      if (inAgg) return { valid: true };
    } else if (kind === 'announcement') {
      const inAgg = await findInSiteContentArray('announcements', 'announcements');
      if (inAgg) return { valid: true };
    }

    // Fallback check in legacy site_content/main doc
    const mainDoc = await firestoreGetDoc('site_content/main');
    if (mainDoc) {
      const arrayMap: Record<string, string> = {
        post: 'authorPosts',
        book: 'books',
        photo: 'photos',
        video: 'videos',
        news: 'news',
        link: 'links',
        announcement: 'announcements',
      };
      const arrKey = arrayMap[kind];
      if (arrKey && Array.isArray(mainDoc[arrKey])) {
        const match = mainDoc[arrKey].find((entry: any) => entry && entry.id === itemId);
        if (match) {
          if (kind === 'book' && match.visibility === 'hidden') {
            return { valid: false, hidden: true };
          }
          return { valid: true };
        }
      }
    }

    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, attempt === 0 ? 800 : 1400));
    }
  }

  return { valid: false };
}

export async function broadcastPushNotification(reqPayload: PushBroadcastRequest): Promise<{
  success: boolean;
  totalSubscribers: number;
  sentCount: number;
  removedExpiredCount: number;
  failedCount: number;
  skippedReason?: string;
}> {
  await ensureVapidReady();

  const kind = reqPayload.kind;
  const title = (reqPayload.title || '').trim().slice(0, 140);
  const body = (reqPayload.body || '').trim().slice(0, 280);
  const safeUrl =
    reqPayload.url && (reqPayload.url.startsWith('/') || reqPayload.url.startsWith('https://'))
      ? reqPayload.url.slice(0, 300)
      : '/';
  const safeImage =
    reqPayload.image && (reqPayload.image.startsWith('https://') || reqPayload.image.startsWith('/'))
      ? reqPayload.image.slice(0, 500)
      : undefined;
  const tag = (reqPayload.tag || `nabil-${kind}-${reqPayload.itemId || Date.now()}`).slice(0, 120);

  if (!title || !body) {
    throw new Error('Notification title and body are required');
  }

  // Test notification strictly targets the supervisor's own current device subscription
  if (kind === 'test') {
    const endpoint = (reqPayload.targetEndpoint || '').trim();
    if (!endpoint) {
      throw new Error('targetEndpoint is required for test notification');
    }
    const allSubs = await listPushSubscriptions();
    const targetSub = allSubs.find((s) => s.endpoint === endpoint);
    if (!targetSub) {
      return {
        success: false,
        totalSubscribers: allSubs.length,
        sentCount: 0,
        removedExpiredCount: 0,
        failedCount: 0,
        skippedReason: 'لم يتم العثور على اشتراك هذا الجهاز بعد. تأكد من تفعيل الإشعارات أولاً.',
      };
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      url: safeUrl,
      image: safeImage,
      tag: `nabil-test-${Date.now()}`,
      kind: 'test',
      sentAt: new Date().toISOString(),
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: targetSub.endpoint,
          keys: { p256dh: targetSub.p256dh, auth: targetSub.auth },
        },
        pushPayload,
        { TTL: 3600 }
      );
      return {
        success: true,
        totalSubscribers: allSubs.length,
        sentCount: 1,
        removedExpiredCount: 0,
        failedCount: 0,
      };
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await removePushSubscription(targetSub.endpoint);
        return {
          success: false,
          totalSubscribers: Math.max(0, allSubs.length - 1),
          sentCount: 0,
          removedExpiredCount: 1,
          failedCount: 1,
          skippedReason: 'انتهت صلاحية اشتراك هذا المتصفح، أعد تفعيل الإشعارات.',
        };
      }
      throw err;
    }
  }

  // Deduplicate real broadcasts so the same item cannot be re-broadcast repeatedly
  if (sentTagsMemory.has(tag)) {
    return {
      success: true,
      totalSubscribers: 0,
      sentCount: 0,
      removedExpiredCount: 0,
      failedCount: 0,
      skippedReason: 'already_sent_in_memory',
    };
  }

  const historyDocId = makeSafeDocId(tag);
  const existingHistory = await firestoreGetDoc(`push_history/${historyDocId}`);
  if (existingHistory) {
    sentTagsMemory.add(tag);
    saveSentTagsToDisk();
    return {
      success: true,
      totalSubscribers: 0,
      sentCount: 0,
      removedExpiredCount: 0,
      failedCount: 0,
      skippedReason: 'already_sent_in_cloud',
    };
  }

  // Verify the published item genuinely exists in Firestore (and is not a hidden draft)
  const itemId = (reqPayload.itemId || '').trim();
  const verification = await verifyItemExistsInFirestore(kind, itemId);
  if (!verification.valid) {
    return {
      success: false,
      totalSubscribers: 0,
      sentCount: 0,
      removedExpiredCount: 0,
      failedCount: 0,
      skippedReason: verification.hidden ? 'hidden_draft' : 'item_not_verified_in_firestore',
    };
  }

  // Record tag before dispatch to prevent race-condition duplicates
  sentTagsMemory.add(tag);
  saveSentTagsToDisk();
  void firestoreUpsertDoc(`push_history/${historyDocId}`, {
    tag,
    kind,
    itemId,
    title,
    sentAt: new Date().toISOString(),
  });

  const subscribers = await listPushSubscriptions();
  if (subscribers.length === 0) {
    return {
      success: true,
      totalSubscribers: 0,
      sentCount: 0,
      removedExpiredCount: 0,
      failedCount: 0,
    };
  }

  const pushPayload = JSON.stringify({
    title,
    body,
    url: safeUrl,
    image: safeImage,
    tag,
    kind,
    sentAt: new Date().toISOString(),
  });

  let sentCount = 0;
  let removedExpiredCount = 0;
  let failedCount = 0;

  // Dispatch concurrently in batches of 15
  const BATCH_SIZE = 15;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload,
            { TTL: 86400 } // Keep queued at Google/Apple push servers for 24h if device is offline
          );
          sentCount++;
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            removedExpiredCount++;
            await removePushSubscription(sub.endpoint);
          } else {
            failedCount++;
            console.warn('[WebPush] Send failure for subscriber:', status || err?.message);
          }
        }
      })
    );
  }

  return {
    success: true,
    totalSubscribers: subscribers.length,
    sentCount,
    removedExpiredCount,
    failedCount,
  };
}
