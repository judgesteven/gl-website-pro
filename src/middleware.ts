import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, request } = context;
  
  // Only apply to paths starting with "/admin"
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  // If ADMIN_PASSWORD is not set, allow access (useful for local dev)
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return next();
  }

  // Check for Basic Auth header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
        'Content-Type': 'text/plain'
      }
    });
  }

  // Extract and decode credentials
  const base64Credentials = authHeader.substring(6);
  let credentials: string;
  try {
    // Use Buffer for Node.js/server environment
    credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  } catch (e) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
        'Content-Type': 'text/plain'
      }
    });
  }

  // Split username:password
  const [username, password] = credentials.split(':');
  
  // Verify password (username can be anything, password must match)
  if (!password || password !== adminPassword) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
        'Content-Type': 'text/plain'
      }
    });
  }

  // Authentication successful, continue
  return next();
};

