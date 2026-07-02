const PIXEL_ID = '27064727209858805';
const GRAPH_URL = 'https://graph.facebook.com/v21.0/' + PIXEL_ID + '/events';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://pattamansa.com.br');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  var accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('[CAPI] META_ACCESS_TOKEN not configured — skipping');
    return res.status(200).json({ skipped: true });
  }

  var body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || !body.event_name) return res.status(400).json({ error: 'event_name required' });

  var eventName      = body.event_name;
  var eventId        = body.event_id || null;
  var customData     = body.custom_data || {};
  var fbp            = body.fbp || null;
  var fbc            = body.fbc || null;
  var eventSourceUrl = body.event_source_url || req.headers['referer'] || 'https://pattamansa.com.br';

  var clientIP = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || '';
  var userAgent = req.headers['user-agent'] || '';

  var userData = { client_ip_address: clientIP, client_user_agent: userAgent };
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  var event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl,
    user_data: userData
  };
  if (eventId) event.event_id = eventId;
  if (Object.keys(customData).length) event.custom_data = customData;

  try {
    var r = await fetch(GRAPH_URL + '?access_token=' + encodeURIComponent(accessToken), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event] })
    });
    var result = await r.json();

    if (!r.ok) {
      console.error('[CAPI]', eventName, 'Meta error:', JSON.stringify(result));
      return res.status(200).json({ warn: 'meta_error' });
    }

    return res.status(200).json({ events_received: result.events_received || 1 });
  } catch (err) {
    console.error('[CAPI]', eventName, 'fetch error:', err.message);
    return res.status(200).json({ warn: 'fetch_error' });
  }
};
