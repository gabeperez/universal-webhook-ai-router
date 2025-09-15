# 🚀 Quick Setup Guide

## ✅ Current Status
- **CloudFlare Worker**: ✅ Deployed at `https://cal-webhook.perez-jg22.workers.dev`
- **Secrets**: ✅ `AI_API_KEY` and `CAL_WEBHOOK_SECRET` configured
- **Health Check**: ✅ Working (`/health` endpoint responds)

## 🔧 Final Step: Cal.com Configuration

### 1. Login to Cal.com
Go to: https://cal.com/settings/developer/webhooks

### 2. Add New Webhook
```
Webhook URL: https://cal-webhook.perez-jg22.workers.dev
Secret: [Your CAL_WEBHOOK_SECRET value]
```

### 3. Select Events
✅ Booking Created  
✅ Booking Confirmed  
✅ Booking Cancelled  
✅ Booking Rescheduled  

### 4. Save & Test
Create a test booking to verify the integration works.

## 🔍 Verification

### Test Health
```bash
curl https://cal-webhook.perez-jg22.workers.dev/health
```

### Monitor Logs
```bash
wrangler tail --name cal-webhook
```

## 📋 What Happens Next

1. **Cal.com sends webhook** → CloudFlare Worker
2. **Worker validates signature** using `CAL_WEBHOOK_SECRET` 
3. **Worker filters for booking events** (ignores others)
4. **Worker forwards to Poke.com** using `AI_API_KEY`
5. **Your AI receives** structured booking notifications

## 🎉 You're Done!

Once you complete the Cal.com configuration above, your AI will automatically receive notifications for:
- New bookings
- Booking confirmations  
- Cancellations
- Reschedules

The integration is secure, reliable, and includes automatic retries.