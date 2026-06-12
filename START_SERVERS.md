# Start Both Servers

## Quick Start

### Option 1: Automated (Windows)
```bash
# Terminal 1 - Backend
cd back-end
start-server.bat

# Terminal 2 - Frontend
cd front-end
npm run dev
```

### Option 2: Manual

**Terminal 1 - Django Backend:**
```bash
cd back-end
venv\Scripts\activate
python manage.py migrate  # Apply performance indexes
python manage.py runserver
```

**Terminal 2 - Next.js Frontend:**
```bash
cd front-end
npm run dev
```

## Verify Everything Works

### 1. Backend Health Check
```bash
curl http://localhost:8000/api/products/featured/
# Should return JSON with products
```

### 2. Redis Connection
```bash
redis-cli ping
# Should return: PONG

# If Redis not running:
# - Windows: Download from https://github.com/tporadowski/redis/releases
# - Or use Docker: docker run -d -p 6379:6379 redis
```

### 3. Frontend
Open http://localhost:3000 in browser

### 4. Check Network Tab
- Open DevTools → Network
- Reload page
- Verify `/api/products/featured/` returns 200 OK
- Second reload should be <100ms (cached)

## Common Issues

### Backend won't start
```bash
# Check Python/Django installed
cd back-end
venv\Scripts\activate
python --version  # Should be 3.10+
pip list | grep Django  # Should show Django 5.0+

# Reinstall if missing
pip install -r requirements/development.txt
```

### "ModuleNotFoundError: No module named 'django'"
```bash
cd back-end
pip install -r requirements/development.txt
```

### Port 8000 already in use
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
python manage.py runserver 8001
# Update front-end/.env.local: NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Redis connection failed
```bash
# Check REDIS_URL in back-end/.env
# Your config shows Upstash Redis (cloud):
# REDIS_URL=rediss://default:...@expert-locust-99214.upstash.io:6379

# This should work without local Redis!
# Test connection:
cd back-end
venv\Scripts\activate
python manage.py shell

>>> from django.core.cache import cache
>>> cache.set('test', 'works', 60)
>>> cache.get('test')
# Should return: 'works'
```

### CORS errors in browser
Check `back-end/.env` has:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Expected Output

**Backend (Terminal 1):**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Frontend (Terminal 2):**
```
  ▲ Next.js 16.2.4 (Turbopack)
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.1s
```

## Performance Testing

After both servers are running:

```bash
# Test backend response time
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/products/featured/

# First request: ~1-3s (database query)
# Second request: <0.1s (cached from Redis)
```

Open http://localhost:3000:
- Open DevTools → Lighthouse
- Run Performance audit
- LCP should be <2.5s (was 12.17s)
- INP should be <200ms (was 400ms)

---

**Both servers must be running for the app to work!**
