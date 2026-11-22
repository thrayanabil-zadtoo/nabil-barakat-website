import {
  broadcastPushNotification,
  ensureVapidReady,
  listPushSubscriptions,
  removePushSubscription,
  savePushSubscription,
} from '../../server/pushService';

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const routeParam = Array.isArray(req.query?.route)
    ? req.query.route[0]
    : req.query?.route || '';
  let route = String(routeParam || '').replace(/^\/+|\/+$/g, '');
  if (!route && typeof req.url === 'string') {
    const cleanPath = req.url.split('?')[0] || '';
    const match = cleanPath.match(/\/api\/push\/([^/]+)/);
    if (match && match[1]) {
      route = match[1].trim();
    }
  }

  try {
    if (req.method === 'GET' && route === 'vapid-public-key') {
      const { publicKey } = await ensureVapidReady();
      return res.status(200).json({ success: true, publicKey });
    }

    if (req.method === 'GET' && route === 'status') {
      const { publicKey } = await ensureVapidReady();
      const subs = await listPushSubscriptions();
      const hasPersistentVapidEnv = Boolean(
        process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()
      );
      return res.status(200).json({
        success: true,
        enabled: true,
        publicKey,
        subscriberCount: subs.length,
        hasPersistentVapidEnv,
      });
    }

    if (req.method === 'POST' && route === 'subscribe') {
      const body = await readJsonBody(req);
      const { subscription, isStandalone, userAgent } = body || {};
      if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return res.status(400).json({ success: false, error: 'بيانات اشتراك الإشعارات غير مكتملة' });
      }
      const saved = await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        expirationTime: subscription.expirationTime ?? null,
        isStandalone: Boolean(isStandalone),
        userAgent: typeof userAgent === 'string' ? userAgent : req.headers?.['user-agent'] || '',
      });
      return res.status(200).json({ success: true, id: saved.id });
    }

    if (req.method === 'POST' && route === 'unsubscribe') {
      const body = await readJsonBody(req);
      const { endpoint } = body || {};
      if (endpoint && typeof endpoint === 'string') {
        await removePushSubscription(endpoint);
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && route === 'send') {
      const reqBody = await readJsonBody(req);
      const { kind, itemId, title, body, url, image, tag, targetEndpoint, subscription } = reqBody || {};
      const validKinds = ['post', 'book', 'video', 'photo', 'news', 'announcement', 'link', 'test'];
      if (!kind || !validKinds.includes(kind)) {
        return res.status(400).json({ success: false, error: 'نوع المحتوى غير صالح' });
      }
      if (!title || !body) {
        return res.status(400).json({ success: false, error: 'عنوان ومحتوى الإشعار مطلوبان' });
      }

      const result = await broadcastPushNotification({
        kind,
        itemId,
        title,
        body,
        url,
        image,
        tag,
        targetEndpoint,
        subscription,
      });
      return res.status(200).json(result);
    }

    return res.status(404).json({ success: false, error: 'Push endpoint not found' });
  } catch (err: any) {
    console.error('[WebPush Serverless] Error:', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Push backend error' });
  }
}
