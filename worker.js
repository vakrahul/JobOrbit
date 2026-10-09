export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy API requests directly to the InstaCloud production backend
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = new URL(request.url);
      backendUrl.protocol = 'https:';
      backendUrl.hostname = 'prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com';
      backendUrl.port = '';

      const modifiedHeaders = new Headers(request.headers);
      modifiedHeaders.set('Host', 'prod-main-api-62dc70-00wtatwcawp.compute.instacloud-edge.com');
      
      const clientIp = request.headers.get('CF-Connecting-IP');
      if (clientIp) {
        modifiedHeaders.set('X-Forwarded-For', clientIp);
        modifiedHeaders.set('CF-Connecting-IP', clientIp);
      }

      const init = {
        method: request.method,
        headers: modifiedHeaders,
        redirect: 'follow',
      };

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
      }

      try {
        const response = await fetch(backendUrl.toString(), init);
        return response;
      } catch (err) {
        return new Response(JSON.stringify({ 
          error: 'Backend Gateway Error', 
          message: err.message 
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Serve static SPA assets from frontend/dist
    return env.ASSETS.fetch(request);
  },
};
