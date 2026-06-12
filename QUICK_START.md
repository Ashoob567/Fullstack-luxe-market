# Quick Start - Apply Performance Fixes

## 1. Apply Database Migrations

```bash
cd back-end

# Activate virtual environment (Windows)
venv\Scripts\activate

# Apply migrations
python manage.py migrate

# Verify indexes were created
python manage.py dbshell
\d+ products_product  # PostgreSQL: List indexes
.schema products_product  # SQLite: List schema
```

## 2. Verify Redis is Running

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# If not installed:
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use Docker: docker run -d -p 6379:6379 redis
```

## 3. Test Backend Performance

```bash
# Start Django server
cd back-end
python manage.py runserver

# In another terminal, test cache:
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/products/featured/

# First request: ~2-3s (no cache)
# Second request: <100ms (cached)
```

## 4. Test Frontend Performance

```bash
# Start Next.js dev server
cd front-end
npm run dev

# Open http://localhost:3000
# Open Chrome DevTools → Lighthouse → Run Audit
```

## 5. Environment Variables

Ensure these are set in `back-end/.env`:

```env
DEBUG=True
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-here
```

## Expected Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Homepage LCP | 12.17s | <2.5s |
| TTFB | 10.38s | <500ms |
| INP | 400ms | <200ms |
| Cache hit rate | 0% | >80% |

## Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Start Redis (Windows)
redis-server

# Check Django can connect
python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test', 'value', 10)
>>> cache.get('test')
# Should return: 'value'
```

### Migration Errors
```bash
# If migration fails, check:
python manage.py showmigrations products

# Fake the migration if indexes already exist:
python manage.py migrate products 0007_add_performance_indexes --fake
```

### Cache Not Working
```bash
# Clear cache and restart
redis-cli FLUSHALL
python manage.py runserver

# Monitor cache activity
redis-cli MONITOR
```

## Files Modified

**Backend:**
- ✅ `apps/products/views.py` - Added caching
- ✅ `apps/products/models.py` - Added indexes
- ✅ `apps/products/migrations/0007_add_performance_indexes.py` - New migration

**Frontend:**
- ✅ `src/components/products/ProductCard.tsx` - Optimized rendering
- ✅ `src/components/products/ProductCardImage.tsx` - Image optimization

## Next Steps

1. Run migration: `python manage.py migrate`
2. Restart backend server
3. Test with Lighthouse
4. Monitor Redis: `redis-cli MONITOR`
5. Check logs: `tail -f back-end/logs/django.log`

---

For detailed explanation, see [PERFORMANCE_FIXES.md](PERFORMANCE_FIXES.md)
