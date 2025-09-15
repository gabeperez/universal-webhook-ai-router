# 🚀 Deployment Guide

## Prerequisites

1. **Cloudflare Account** (free tier works)
2. **Node.js 18+** installed locally
3. **Your AI API Key** (from Poke.com or custom AI service)

## Option 1: One-Click Deploy (Easiest)

1. Click: [![Deploy](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gabeperez/universal-webhook-ai-router)
2. Connect your Cloudflare account
3. Set environment variables:
   - `AI_API_KEY`: Your AI service API key
   - `CAL_WEBHOOK_SECRET`: (optional) Your Cal.com webhook secret
4. Deploy!

Your webhook URL will be: `https://your-worker-name.your-subdomain.workers.dev`

## Option 2: Manual Deploy

### 1. Clone and Setup
```bash
git clone https://github.com/gabeperez/universal-webhook-ai-router.git
cd universal-webhook-ai-router
npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Configure Secrets
```bash
# Required: Your AI API key
npx wrangler secret put AI_API_KEY

# Optional: Service webhook secrets for signature validation
npx wrangler secret put CAL_WEBHOOK_SECRET
npx wrangler secret put GITHUB_WEBHOOK_SECRET
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Update wrangler.jsonc
Edit `wrangler.jsonc` to set your worker name:
```json
{
  "name": "my-webhook-router",
  "main": "src/index.ts", 
  "compatibility_date": "2025-09-15"
}
```

### 5. Deploy
```bash
npx wrangler deploy
```

## Configuration

### AI Endpoints

**Poke.com (default):**
- No additional configuration needed
- Just set `AI_API_KEY`

**Custom AI Service:**
```bash
npx wrangler secret put AI_ENDPOINT
# Set to: https://your-ai-api.com/webhook
```

### Webhook Secrets (Optional but Recommended)

For security, configure webhook secrets for each service:

**Cal.com:**
1. In Cal.com → Settings → Developer → Webhooks
2. Set webhook secret, then run:
```bash
npx wrangler secret put CAL_WEBHOOK_SECRET
```

**GitHub:**
1. In GitHub repo → Settings → Webhooks
2. Set secret, then run:
```bash
npx wrangler secret put GITHUB_WEBHOOK_SECRET  
```

**Stripe:**
1. In Stripe Dashboard → Developers → Webhooks
2. Copy signing secret, then run:
```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Testing

### 1. Health Check
```bash
curl https://your-worker.workers.dev/health
```

### 2. Test Webhook
```bash
curl -X POST https://your-worker.workers.dev/ \
  -H "Content-Type: application/json" \
  -H "User-Agent: GitHub-Hookshot/test" \
  -d '{"action":"push","repository":{"name":"test-repo"}}'
```

### 3. Monitor Logs
```bash
npx wrangler tail
```

## Adding Webhooks

Point your service webhooks to: `https://your-worker.workers.dev`

### Supported Services
- ✅ Cal.com: `https://your-worker.workers.dev`
- ✅ GitHub: `https://your-worker.workers.dev`  
- ✅ Stripe: `https://your-worker.workers.dev`
- ✅ Shopify: `https://your-worker.workers.dev`
- ✅ Slack: `https://your-worker.workers.dev`
- ✅ Any service: `https://your-worker.workers.dev`

The router automatically detects the service type and formats appropriate messages.

## Troubleshooting

### Common Issues

**"Invalid signature" errors:**
- Verify webhook secret matches service configuration
- Check that secret is properly set in Wrangler

**"Failed to process webhook" errors:**
- Verify `AI_API_KEY` is correct
- Check AI service is accessible
- Review logs with `wrangler tail`

**Worker not responding:**
- Check deployment succeeded: `wrangler deployments list`
- Verify correct worker URL
- Test health endpoint first

### Getting Help

1. **Check logs**: `npx wrangler tail` 
2. **Test locally**: `npx wrangler dev`
3. **Create issue**: [GitHub Issues](https://github.com/gabeperez/universal-webhook-ai-router/issues)
4. **Email support**: gabe@webhookrouter.dev

## Limits (Cloudflare Free Tier)

- **100,000 requests/day** (more than enough for most users)
- **10ms CPU time per request** (plenty for webhook processing)
- **No storage limits** (stateless worker)

Upgrade to Cloudflare Workers Paid for unlimited requests at $5/10M requests.

## Security Best Practices

1. **Use webhook secrets** for signature validation
2. **Rotate API keys** periodically  
3. **Monitor logs** for suspicious activity
4. **Use HTTPS only** (enforced by default)
5. **Keep dependencies updated**: `npm audit`

---

Need managed hosting instead? Check out [webhookrouter.dev](https://webhookrouter.dev) for $5/month hosted solution with monitoring, automatic updates, and support!