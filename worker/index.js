const CACHE_TTL_SECONDS = 300;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const ROUTES = {
  '/api/products': { firestorePath: '/products', type: 'collection' },
  '/api/settings': { firestorePath: '/settings/config', type: 'document' },
  '/api/discounts': { firestorePath: '/discounts', type: 'collection' }
};

addEventListener('fetch', function (event) {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const request = event.request;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const route = ROUTES[url.pathname];
  if (!route) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return withCorsHeaders(cached, 'HIT');
  }

  try {
    const upstreamResponse = await fetch(FIRESTORE_BASE + route.firestorePath);
    if (!upstreamResponse.ok) {
      return jsonResponse({ error: 'Firestore request failed', status: upstreamResponse.status }, 502);
    }

    const upstreamJson = await upstreamResponse.json();
    const payload = route.type === 'collection'
      ? decodeDocuments(upstreamJson.documents || [])
      : decodeDocument(upstreamJson);

    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: buildResponseHeaders('MISS')
    });

    event.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return jsonResponse({ error: 'Unexpected worker error', message: error.message || 'unknown' }, 500);
  }
}

function buildResponseHeaders(cacheStatus) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=' + CACHE_TTL_SECONDS,
    'Access-Control-Allow-Origin': CORS_HEADERS['Access-Control-Allow-Origin'],
    'Access-Control-Allow-Methods': CORS_HEADERS['Access-Control-Allow-Methods'],
    'Access-Control-Allow-Headers': CORS_HEADERS['Access-Control-Allow-Headers'],
    'X-Cache': cacheStatus
  };
}

function withCorsHeaders(response, cacheStatus) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', CORS_HEADERS['Access-Control-Allow-Origin']);
  headers.set('Access-Control-Allow-Methods', CORS_HEADERS['Access-Control-Allow-Methods']);
  headers.set('Access-Control-Allow-Headers', CORS_HEADERS['Access-Control-Allow-Headers']);
  headers.set('X-Cache', cacheStatus || headers.get('X-Cache') || 'HIT');
  if (!headers.get('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status,
    headers: buildResponseHeaders('BYPASS')
  });
}

function decodeDocuments(documents) {
  return documents.map(function (document) {
    return decodeDocument(document);
  });
}

function decodeDocument(document) {
  const data = decodeFields(document && document.fields ? document.fields : {});
  if (document && document.name) {
    data.id = document.name.split('/').pop();
  }
  return data;
}

function decodeFields(fields) {
  const output = {};
  for (const key of Object.keys(fields)) {
    output[key] = decodeValue(fields[key]);
  }
  return output;
}

function decodeValue(value) {
  if (!value) return null;
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return Boolean(value.booleanValue);
  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
  if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, 'referenceValue')) return value.referenceValue;
  if (Object.prototype.hasOwnProperty.call(value, 'bytesValue')) return value.bytesValue;
  if (Object.prototype.hasOwnProperty.call(value, 'geoPointValue')) return value.geoPointValue;
  if (Object.prototype.hasOwnProperty.call(value, 'arrayValue')) {
    return (value.arrayValue.values || []).map(function (item) {
      return decodeValue(item);
    });
  }
  if (Object.prototype.hasOwnProperty.call(value, 'mapValue')) {
    return decodeFields(value.mapValue.fields || {});
  }
  return null;
}
