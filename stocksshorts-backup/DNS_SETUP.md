# DNS Configuration for StocksShorts

## Domain Setup Requirements

### Primary Domain Configuration
```
Domain: stocksshorts.com (or your chosen domain)
```

### DNS Records to Add

#### 1. A Records (IPv4)
```
Type: A
Name: @ (root domain)
Value: [Your Replit deployment IP]
TTL: 300 (5 minutes)

Type: A
Name: www
Value: [Your Replit deployment IP]
TTL: 300 (5 minutes)
```

#### 2. CNAME Records (Alternative)
```
Type: CNAME
Name: @
Value: [your-repl-name].[your-username].replit.app
TTL: 300

Type: CNAME
Name: www
Value: [your-repl-name].[your-username].replit.app
TTL: 300
```

### Replit Deployment Domain
```
Default URL: https://[your-repl-name].[your-username].replit.app
Custom Domain: https://stocksshorts.com
```

### SSL/TLS Configuration
- Replit automatically provides SSL certificates
- Force HTTPS redirect (handled by Replit)
- Certificate auto-renewal enabled

### DNS Provider Instructions

#### For Cloudflare:
1. Add A record: `@` → Replit IP
2. Add A record: `www` → Replit IP
3. Set SSL/TLS mode to "Full (strict)"
4. Enable "Always Use HTTPS"

#### For Namecheap:
1. Go to Domain List → Manage
2. Advanced DNS tab
3. Add A Record: Host: `@`, Value: Replit IP
4. Add A Record: Host: `www`, Value: Replit IP

#### For GoDaddy:
1. DNS Management
2. Add A record: Name: `@`, Value: Replit IP
3. Add A record: Name: `www`, Value: Replit IP

### Additional Records (Recommended)

#### MX Records (for email)
```
Type: MX
Priority: 10
Value: mail.stocksshorts.com
```

#### TXT Records (for verification)
```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all" (if using Google Workspace)
```

### Propagation Time
- DNS changes typically take 24-48 hours to fully propagate
- Use tools like `dig` or online DNS checkers to verify

### Testing Commands
```bash
# Check A record
dig stocksshorts.com A

# Check CNAME
dig www.stocksshorts.com CNAME

# Check from specific DNS server
dig @8.8.8.8 stocksshorts.com
```

### Common Issues & Solutions

1. **DNS not propagating**: Wait 24-48 hours or clear DNS cache
2. **SSL errors**: Ensure Replit deployment is active
3. **Subdomain issues**: Verify CNAME points to correct Replit URL

### Production Checklist
- [ ] A record for root domain (@)
- [ ] A record for www subdomain
- [ ] SSL certificate active
- [ ] HTTPS redirect working
- [ ] Domain resolves to correct IP
- [ ] Application loads successfully