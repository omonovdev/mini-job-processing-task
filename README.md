# Mini Job Processing Platform

NestJS + PostgreSQL + Redis + BullMQ asosida background job processing.

## Ishga tushirish

```bash
npm install
cp env.example .env        # keyin .env ni o'zgartiring
docker-compose up -d       # postgres + redis
npm run migration:run
npm run start:dev
```

Swagger: http://localhost:2000/api

## API

```
POST /auth/register
POST /auth/login
POST /auth/refresh

POST /tasks
GET  /tasks
GET  /tasks/:id
POST /tasks/:id/cancel
POST /tasks/:id/reprocess   (admin)

GET  /metrics                (admin)
```

## Qanday ishlaydi

Task yaratilganda PostgreSQL ga yoziladi va BullMQ queue ga tushadi. Worker uni olib ishlov beradi — agar xato bo'lsa 3 marta qayta urinadi (2s, 4s, 8s interval bilan). 3 ta urinishdan keyin ham ishlamasa dead-letter queue ga o'tadi.

Har bir task type uchun alohida rate limit bor (email: 5/min, report: 2/min) — Redis orqali INCR + EXPIRE bilan ishlaydi. Limit oshsa job avtomatik kechiktiriladi.

```
Client → Controller → Service → PostgreSQL
                         └──→ BullMQ → Worker → MockService
                                          ├──→ Redis Rate Limiter
                                          └──→ Dead-Letter Queue
```

## Nimalar qildim

- access + refresh token (alohida expiry, env dan boshqariladi)
- admin user server start bo'lganda avtomatik yaratiladi (env dan)
- idempotency_key orqali dublikat task oldini olish
- scheduledAt bilan taskni kelajakka rejalashtirish
- priority queue (high/normal/low)
- barcha env lar Joi bilan validatsiya qilinadi (port, hostname, pattern)
- global exception filter — har bir xato structured error code bilan qaytadi
- request logger middleware — har bir so'rovning vaqtini yozib boradi
- helmet, cors, throttle (30 req/min)

## Nega aynan shunday

- **migrations** — synchronize ishlatmadim, chunki production da column o'chib ketishi mumkin
- **BullMQ** — cron scheduler retry, delay, priority, DLQ bera olmaydi
- **Redis rate limiter** — BullMQ ning built-in limiter i global, menga type bo'yicha alohida kerak edi
- **offset pagination** — cursor murakkabroq, filter bilan qo'shib ishlatish qiyin, MVP uchun offset yetadi
- **worker bitta process da** — deploy oson, katta load da alohida service ga ajratish mumkin
- **stateless JWT** — token revoke qilib bo'lmaydi lekin MVP uchun yetarli, prod da Redis blacklist qo'shiladi
