# 📍 iOS Location Shortcut Setup

Instead of dealing with MCP server connectivity issues, you can send location data directly via webhooks using iOS Shortcuts.

## 🎯 Create iOS Shortcut

1. Open **Shortcuts** app on iPhone
2. Tap **"+"** to create new shortcut
3. Add these actions in order:

### Actions:
1. **Get Current Location** 
   - Allow access when prompted

2. **Get Contents of URL**
   - URL: `https://your-worker-name.your-subdomain.workers.dev`
   - Method: `POST`
   - Headers: 
     - `Content-Type`: `application/json`
     - `User-Agent`: `iOS-Shortcuts/Location`
   - Request Body (JSON):
   ```json
   {
     "latitude": [Current Location > Latitude],
     "longitude": [Current Location > Longitude], 
     "accuracy": [Current Location > Accuracy],
     "location": "[Current Location > Formatted Address]",
     "timestamp": "[Current Date]"
   }
   ```

3. **Show Result** (optional - to see response)

## 🔧 Shortcut Configuration

**Name:** "Share Location with AI"
**Icon:** 📍 (Location pin)
**Color:** Blue

## 📱 Usage Options

### Manual Trigger:
- Run shortcut from Shortcuts app
- Add to Home Screen for quick access
- Say "Hey Siri, Share Location with AI"

### Automatic Triggers:
- **Arrive at location**: When you arrive at work/home
- **Leave location**: When you leave a specific place
- **Time of day**: Daily location check-in
- **App trigger**: When opening Maps or other location apps

## 🎯 What Your AI Receives

Your AI will get messages like:
- 📍 "Location: 123 Main Street, San Francisco, CA (±5m) at 2:30 PM"
- 📍 "Location: 37.7749, -122.4194 (±10m) at 2:30 PM"

## ✅ Advantages over MCP

- **No connectivity issues** - HTTP webhooks always work
- **No 502 errors** - CloudFlare Workers are ultra-reliable  
- **Faster** - Sub-10ms response time
- **Simpler** - No MCP server configuration needed
- **More flexible** - Can trigger from anywhere, anytime

## 🔧 Advanced: Siri Integration

Add Siri phrase: "Where am I running late to?"
- Gets current location
- Sends to AI via webhook  
- AI can respond with contextual help

**Perfect replacement for problematic MCP location servers!** 🚀