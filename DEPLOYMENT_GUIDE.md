# StocksShorts Deployment Guide

## Getting Your Replit Deployment URL

### Step 1: Find Your Deployment URL
1. In your Replit workspace, look for the deployment panel
2. Your URL should be something like: `https://stocksshorts-[username].replit.app`
3. Copy this exact URL

### Step 2: Test Your Deployment
Visit your deployment URL to ensure StocksShorts is working correctly.

## GoDaddy DNS Setup (Post-Deployment)

### Required DNS Records for GoDaddy:

#### Option A: Using CNAME (Recommended)
```
Record 1:
Type: CNAME
Name: @
Value: stocksshorts-[username].replit.app
TTL: 600

Record 2:
Type: CNAME
Name: www
Value: stocksshorts-[username].replit.app
TTL: 600
```

#### Option B: Using A Records (if CNAME doesn't work for root)
1. First, get the IP address:
   ```bash
   nslookup stocksshorts-[username].replit.app
   ```

2. Then add these records:
   ```
   Record 1:
   Type: A
   Name: @
   Value: [IP from nslookup]
   TTL: 600

   Record 2:
   Type: A
   Name: www
   Value: [IP from nslookup]
   TTL: 600
   ```

### GoDaddy Configuration Steps:
1. Login to GoDaddy account
2. Go to "My Products" → "DNS"
3. Find your domain
4. Delete existing A records for @ and www
5. Add the new records above
6. Save changes

### Verification:
- Wait 1-24 hours for DNS propagation
- Test: `ping yourdomain.com`
- Verify SSL: visit `https://yourdomain.com`

## Custom Domain in Replit
After DNS is set up:
1. Go to your Repl's deployment settings
2. Add your custom domain
3. Replit will automatically handle SSL certificates

Your StocksShorts app will be live at your custom domain!