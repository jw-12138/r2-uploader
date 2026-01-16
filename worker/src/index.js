/**
 * R2 Uploader Worker
 * 
 * Handles file upload/download/delete operations with Cloudflare R2.
 * Supports multipart upload for large files (>95MB).
 * 
 * Environment bindings required:
 * - R2_BUCKET: R2 bucket binding
 * - AUTH_KEY_SECRET: API key for authentication
 * - PRIVATE_BUCKET (optional): Set to "true" to require auth for all requests
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Add CORS headers to response
 */
function corsResponse(body, init = {}) {
  const headers = new Headers(init.headers || {});
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(body, { ...init, headers });
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return corsResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses XOR comparison to ensure all characters are checked regardless of match.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Length check - for best security, API keys should have a fixed length
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate API key using constant-time comparison
 */
function validateApiKey(request, env) {
  const apiKey = request.headers.get('x-api-key');
  const secret = env.AUTH_KEY_SECRET;
  
  if (!apiKey || !secret) {
    return false;
  }
  
  return timingSafeEqual(apiKey, secret);
}

/**
 * Check if request requires authentication
 */
function requiresAuth(request, env) {
  // Write operations always require auth
  if (['PUT', 'POST', 'DELETE', 'PATCH'].includes(request.method)) {
    return true;
  }
  // If PRIVATE_BUCKET is set, all requests require auth
  if (env.PRIVATE_BUCKET === 'true') {
    return true;
  }
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return corsResponse(null, { status: 204 });
    }

    // Auth check
    if (requiresAuth(request, env) && !validateApiKey(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    try {
      // Route: GET / - Hello message
      if (method === 'GET' && path === '/') {
        return corsResponse('Hello R2!');
      }

      // Route: GET /support_mpu - Check MPU support
      if (method === 'GET' && path === '/support_mpu') {
        return jsonResponse({ supported: true });
      }

      // Route: PATCH / - List objects
      if (method === 'PATCH' && (path === '/' || path === '')) {
        const cursor = url.searchParams.get('cursor') || undefined;
        const listed = await env.R2_BUCKET.list({
          limit: 1000,
          cursor,
        });

        const objects = listed.objects.map((obj) => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded.toISOString(),
          httpEtag: obj.httpEtag,
        }));

        return jsonResponse({
          objects,
          truncated: listed.truncated,
          cursor: listed.truncated ? listed.cursor : undefined,
        });
      }

      // Route: PUT /:key - Upload file
      if (method === 'PUT' && path.length > 1 && !path.startsWith('/mpu/')) {
        const key = decodeURIComponent(path.slice(1));
        const contentType = request.headers.get('content-type') || 'application/octet-stream';

        await env.R2_BUCKET.put(key, request.body, {
          httpMetadata: { contentType },
        });

        return jsonResponse({ success: true, key });
      }

      // Route: DELETE /:key - Delete file
      if (method === 'DELETE' && path.length > 1 && !path.startsWith('/mpu/')) {
        const key = decodeURIComponent(path.slice(1));
        await env.R2_BUCKET.delete(key);
        return jsonResponse({ success: true, key });
      }

      // Route: GET /:key - Download file
      if (method === 'GET' && path.length > 1 && !path.startsWith('/mpu/')) {
        const key = decodeURIComponent(path.slice(1));
        const object = await env.R2_BUCKET.get(key);

        if (!object) {
          return jsonResponse({ error: 'Object not found' }, 404);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        for (const [k, v] of Object.entries(CORS_HEADERS)) {
          headers.set(k, v);
        }

        return new Response(object.body, { headers });
      }

      // ========== Multipart Upload Routes ==========

      // Route: POST /mpu/create/:key - Create multipart upload
      if (method === 'POST' && path.startsWith('/mpu/create/')) {
        const key = decodeURIComponent(path.slice('/mpu/create/'.length));
        const mpu = await env.R2_BUCKET.createMultipartUpload(key);
        return jsonResponse({ uploadId: mpu.uploadId, key: mpu.key });
      }

      // Route: PUT /mpu/:key?uploadId=&partNumber= - Upload part
      if (method === 'PUT' && path.startsWith('/mpu/') && !path.startsWith('/mpu/create/') && !path.startsWith('/mpu/complete/')) {
        const key = decodeURIComponent(path.slice('/mpu/'.length));
        const uploadId = url.searchParams.get('uploadId');
        const partNumber = parseInt(url.searchParams.get('partNumber'), 10);

        if (!uploadId || isNaN(partNumber)) {
          return jsonResponse({ error: 'Missing uploadId or partNumber' }, 400);
        }

        const mpu = env.R2_BUCKET.resumeMultipartUpload(key, uploadId);
        const part = await mpu.uploadPart(partNumber, request.body);

        return jsonResponse({ etag: part.etag, partNumber });
      }

      // Route: POST /mpu/complete/:key?uploadId= - Complete multipart upload
      if (method === 'POST' && path.startsWith('/mpu/complete/')) {
        const key = decodeURIComponent(path.slice('/mpu/complete/'.length));
        const uploadId = url.searchParams.get('uploadId');

        if (!uploadId) {
          return jsonResponse({ error: 'Missing uploadId' }, 400);
        }

        const body = await request.json();
        const parts = body.parts;

        if (!parts || !Array.isArray(parts)) {
          return jsonResponse({ error: 'Missing parts array' }, 400);
        }

        const mpu = env.R2_BUCKET.resumeMultipartUpload(key, uploadId);
        const uploaded = await mpu.complete(parts);

        return jsonResponse({
          success: true,
          key: uploaded.key,
          etag: uploaded.httpEtag,
        });
      }

      // Route: DELETE /mpu/:key?uploadId= - Abort multipart upload
      if (method === 'DELETE' && path.startsWith('/mpu/')) {
        const key = decodeURIComponent(path.slice('/mpu/'.length));
        const uploadId = url.searchParams.get('uploadId');

        if (!uploadId) {
          return jsonResponse({ error: 'Missing uploadId' }, 400);
        }

        const mpu = env.R2_BUCKET.resumeMultipartUpload(key, uploadId);
        await mpu.abort();

        return jsonResponse({ success: true, aborted: true });
      }

      // Not found
      return jsonResponse({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Worker error:', err.stack || err);
      return jsonResponse({ error: 'Internal Server Error' }, 500);
    }
  },
};

