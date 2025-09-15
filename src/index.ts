/**
 * Generic Webhook Router -> Poke.com AI Integration
 * 
 * Receives webhooks from multiple services (Cal.com, GitHub, Stripe, etc.)
 * and forwards formatted messages to your AI at poke.com
 */

// Service detection and routing functions
function detectWebhookService(userAgent, headers, body) {
  // Cal.com detection
  if (userAgent === 'node' || headers['cal-signature']) {
    return { name: 'cal.com', type: 'calendar' };
  }
  
  // GitHub detection
  if (userAgent.includes('GitHub-Hookshot') || headers['x-github-event']) {
    return { name: 'github', type: 'code' };
  }
  
  // Stripe detection
  if (userAgent.includes('Stripe') || headers['stripe-signature']) {
    return { name: 'stripe', type: 'payment' };
  }
  
  // Shopify detection
  if (headers['x-shopify-topic'] || headers['x-shopify-hmac-sha256']) {
    return { name: 'shopify', type: 'ecommerce' };
  }
  
  // Slack detection
  if (userAgent.includes('Slackbot') || headers['x-slack-signature']) {
    return { name: 'slack', type: 'communication' };
  }
  
  // Discord detection
  if (userAgent.includes('Discord') || headers['x-signature-ed25519']) {
    return { name: 'discord', type: 'communication' };
  }
  
  // Zapier detection
  if (userAgent.includes('Zapier')) {
    return { name: 'zapier', type: 'automation' };
  }
  
  // Default/unknown
  return { name: 'unknown', type: 'generic' };
}

function getSignatureHeader(service, headers) {
  const signatureHeaders = {
    'cal.com': 'cal-signature',
    'github': 'x-hub-signature-256',
    'stripe': 'stripe-signature',
    'shopify': 'x-shopify-hmac-sha256',
    'slack': 'x-slack-signature',
    'discord': 'x-signature-ed25519'
  };
  
  return headers[signatureHeaders[service.name]] || null;
}

// Process webhook based on service type
async function processWebhook(service, body) {
  try {
    const data = JSON.parse(body);
    
    switch (service.name) {
      case 'cal.com':
        return processCalcomWebhook(data);
      case 'github':
        return processGitHubWebhook(data);
      case 'stripe':
        return processStripeWebhook(data);
      case 'shopify':
        return processShopifyWebhook(data);
      case 'slack':
        return processSlackWebhook(data);
      default:
        return processGenericWebhook(service, data);
    }
  } catch (error) {
    return {
      message: `Raw webhook from ${service.name}: ${body.substring(0, 200)}`,
      shouldProcess: true,
      rawData: { error: error.message, body }
    };
  }
}

function processCalcomWebhook(data) {
  const { triggerEvent, payload: booking } = data;
  const supportedEvents = ['BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED', 'BOOKING_CONFIRMED'];
  
  if (!supportedEvents.includes(triggerEvent)) {
    return { message: null, shouldProcess: false, rawData: data };
  }
  
  const eventMessages = {
    'BOOKING_CREATED': `📅 New booking: "${booking.title}" scheduled for ${booking.startTime} with ${booking.attendees?.map(a => a.name).join(', ') || 'unknown attendee'}`,
    'BOOKING_CONFIRMED': `✅ Booking confirmed: "${booking.title}" at ${booking.startTime}`,
    'BOOKING_CANCELLED': `❌ Booking cancelled: "${booking.title}" was scheduled for ${booking.startTime}${booking.cancelReason ? `. Reason: ${booking.cancelReason}` : ''}`,
    'BOOKING_RESCHEDULED': `🔄 Booking rescheduled: "${booking.title}" moved to ${booking.startTime}${booking.rescheduleReason ? `. Reason: ${booking.rescheduleReason}` : ''}`
  };
  
  return {
    message: eventMessages[triggerEvent] || `Calendar event: ${triggerEvent} for "${booking.title}"`,
    shouldProcess: true,
    rawData: { event: triggerEvent, booking }
  };
}

function processGitHubWebhook(data) {
  const eventType = data.action || 'unknown';
  const repo = data.repository?.name || 'unknown repo';
  
  const messages = {
    'push': `🔄 Code pushed to ${repo}${data.commits ? ` (${data.commits.length} commits)` : ''}`,
    'pull_request.opened': `🔀 New pull request opened in ${repo}: "${data.pull_request?.title}"`,
    'pull_request.closed': `✅ Pull request ${data.pull_request?.merged ? 'merged' : 'closed'} in ${repo}`,
    'issues.opened': `🐛 New issue opened in ${repo}: "${data.issue?.title}"`,
    'release.published': `🚀 New release published in ${repo}: ${data.release?.tag_name}`
  };
  
  return {
    message: messages[`${data.action}`] || `GitHub event in ${repo}: ${eventType}`,
    shouldProcess: true,
    rawData: data
  };
}

function processStripeWebhook(data) {
  const eventType = data.type;
  const amount = data.data?.object?.amount ? `$${(data.data.object.amount / 100).toFixed(2)}` : '';
  
  const messages = {
    'payment_intent.succeeded': `💳 Payment successful: ${amount}`,
    'payment_intent.payment_failed': `❌ Payment failed: ${amount}`,
    'customer.subscription.created': `📦 New subscription created`,
    'customer.subscription.deleted': `🚫 Subscription cancelled`,
    'invoice.payment_succeeded': `✅ Invoice paid: ${amount}`,
    'invoice.payment_failed': `❌ Invoice payment failed: ${amount}`
  };
  
  return {
    message: messages[eventType] || `Stripe event: ${eventType}`,
    shouldProcess: true,
    rawData: data
  };
}

function processShopifyWebhook(data) {
  return {
    message: `🛍️ Shopify event: ${JSON.stringify(data).substring(0, 100)}...`,
    shouldProcess: true,
    rawData: data
  };
}

function processSlackWebhook(data) {
  return {
    message: `💬 Slack event: ${data.event?.type || 'unknown'}`,
    shouldProcess: true,
    rawData: data
  };
}

function processGenericWebhook(service, data) {
  return {
    message: `🔔 ${service.name} notification: ${JSON.stringify(data).substring(0, 100)}...`,
    shouldProcess: true,
    rawData: data
  };
}

// Helper function to verify HMAC-SHA256 signature
async function verifySignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedHex;
}

// Helper function to make request to AI with retry and endpoint discovery
async function forwardToAI(payload, apiKey, primaryEndpoint, retryCount = 0) {
  const maxRetries = 2;
  
  // Try different endpoint variations for Poke.com (starting with official)
  const endpoints = [
    'https://poke.com/api/v1/inbound-sms/webhook', // Official endpoint
    primaryEndpoint,
    'https://api.interaction.co/v1/messages',
    'https://api.interaction.co/v1/chat',
    'https://api.interaction.co/v1/webhook',
    'https://api.interaction.co/webhook',
    'https://api.poke.com/v1/messages',
    'https://poke.com/api/v1/messages'
  ];
  
  const currentEndpoint = endpoints[retryCount] || primaryEndpoint;
  
  try {
    console.log(`Trying endpoint: ${currentEndpoint}`);
    
    // Use official Poke.com API authentication format
    const authHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cal-webhook-worker/1.0'
    };
    
    const response = await fetch(currentEndpoint, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`AI API responded with status ${response.status}: ${errorText}`);
    }
    
    console.log(`Success with endpoint: ${currentEndpoint}`);
    return await response.json();
  } catch (error) {
    console.log(`Failed with endpoint ${currentEndpoint}:`, error.message);
    
    if (retryCount < endpoints.length - 1) {
      console.log(`Trying next endpoint...`);
      // Try next endpoint immediately
      return forwardToAI(payload, apiKey, primaryEndpoint, retryCount + 1);
    } else if (retryCount < maxRetries + endpoints.length - 1) {
      console.log(`Retrying with exponential backoff...`);
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - endpoints.length + 1) * 1000));
      return forwardToAI(payload, apiKey, primaryEndpoint, retryCount + 1);
    }
    throw error;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Main webhook endpoint (root path)
    if (url.pathname === '/' && request.method === 'POST') {
      try {
        // Get the raw body for signature verification
        const body = await request.text();
        
        // Detect webhook source and gather request info
        const userAgent = request.headers.get('user-agent') || '';
        const contentType = request.headers.get('content-type') || '';
        const allHeaders = Object.fromEntries(request.headers.entries());
        
        // Detect service based on headers and user-agent
        const service = detectWebhookService(userAgent, allHeaders, body);
        const signature = getSignatureHeader(service, allHeaders);
        
        console.log('=== WEBHOOK REQUEST ===');
        console.log('Detected Service:', service.name);
        console.log('User-Agent:', userAgent);
        console.log('Content-Type:', contentType);
        console.log('Has Signature:', !!signature);
        console.log('Body Length:', body.length);
        console.log('=======================');
        
        // Handle ping tests for various services
        const isPingTest = 
          (service.name === 'cal.com' && userAgent === 'node') ||           // Cal.com ping
          (service.name === 'github' && allHeaders['x-github-event'] === 'ping') || // GitHub ping
          (service.name === 'stripe' && body.includes('"type":"ping"')) ||   // Stripe ping
          (service.name === 'unknown' && body.length < 50);                   // Generic small payload
        
        if (isPingTest) {
          console.log('Detected ping test - returning success');
          return new Response(JSON.stringify({ 
            ok: true, 
            message: 'Webhook endpoint ready',
            debug: {
              userAgent,
              bodyLength: body.length,
              hasSignature: !!signature
            }
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Verify signature for services that require it (not ping tests)
        if (!isPingTest && service.name === 'cal.com' && env.CAL_WEBHOOK_SECRET) {
          if (!signature) {
            console.log('Missing signature for Cal.com webhook');
            return new Response(JSON.stringify({ error: 'Missing cal-signature header' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const isValid = await verifySignature(body, signature, env.CAL_WEBHOOK_SECRET);
          if (!isValid) {
            console.log('Invalid signature for Cal.com webhook');
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          console.log('✅ Cal.com signature validation passed');
        } else if (!isPingTest && signature) {
          console.log(`⚠️ ${service.name} webhook has signature but no validation configured`);
        }
        
        // Parse the webhook payload and process based on service
        const { message, shouldProcess, rawData } = await processWebhook(service, body);
        
        if (!shouldProcess) {
          console.log(`Ignoring ${service.name} event`);
          return new Response(JSON.stringify({ ok: true, ignored: true, service: service.name }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Format payload according to Poke.com API specification
        const aiPayload = { message };
        console.log('Processed message:', message);
        console.log('Raw data:', rawData);
        
        // Forward to AI (if endpoint is configured)
        console.log('Processing webhook from:', service.name);
        console.log('Payload to be sent to AI:', aiPayload);
        
        const aiEndpoint = env.AI_ENDPOINT || 'https://poke.com/api/v1/inbound-sms/webhook';
        
        if (env.AI_API_KEY) {
          try {
            console.log('Forwarding to AI endpoint:', aiEndpoint);
            await forwardToAI(aiPayload, env.AI_API_KEY, aiEndpoint);
            console.log('Successfully forwarded to AI');
            
            return new Response(JSON.stringify({ 
              ok: true, 
              processed: true,
              service: service.name,
              message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error('Failed to forward to AI:', error.message);
            
            return new Response(JSON.stringify({ 
              error: 'Failed to process webhook', 
              details: error.message,
              endpoint: aiEndpoint
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } else {
          console.log('AI_API_KEY not configured - skipping AI forwarding');
          return new Response(JSON.stringify({ 
            ok: true, 
            processed: false,
            debug: 'AI_API_KEY not configured',
            service: service.name,
            message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
      } catch (error) {
        console.error('Webhook processing error:', error);
        
        return new Response(JSON.stringify({ 
          error: 'Internal server error', 
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Default 404 response
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
