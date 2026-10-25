# TicketHub System Design

## 1. Requirements

### Functional requirements
- Users can register, sign in, and manage their accounts.
- Users can browse and search events, view event details and seat maps, and see seat availability.
- Users can join a virtual queue for a high-demand sale, select available seats, and hold them temporarily during checkout.
- Users can pay for a hold, view their orders, and receive digital tickets with unique QR codes.
- Users can cancel eligible orders; expired or released holds return their seats to inventory.

### Non-functional requirements
- **No double-selling:** A physical seat for an event can belong to at most one active hold or completed order. The database is the source of truth for this invariant.
- **Fairness:** High-demand sales use a virtual queue with an explicit, auditable admission order.
- **Performance:** Event browsing should remain fast through caching; seat-hold requests should receive a prompt success or sold-out response under peak load.
- **Availability:** Browsing and queue status remain available during demand spikes, while seat allocation favors consistency over availability.
- **Security and reliability:** Authenticate account and order actions, protect payment data through a payment provider, and make purchase requests idempotent so retries do not create duplicate orders.

## 2. Traffic and capacity estimates

### Normal day
- Registered users: **2,000,000**.
- Daily visitors: **50,000**, with **10 page views each** = **500,000 page views/day**.
- Average page-view rate: `500,000 / 86,400 ≈ 5.8 views/second` (about **5.8 page requests/second** if one page view maps to one page request).
- For a rough busy-hour estimate, assume page views are concentrated in 10 hours: `500,000 / 36,000 ≈ 13.9 views/second`. A 2x busy-hour burst is approximately **28 page requests/second**. This is a planning assumption, not a measured peak.
- Tickets sold: **5,000/day**, or `5,000 / 86,400 ≈ 0.058 sales/second` on average.

### Popular concert on-sale
- **200,000 people** attempt to buy **20,000 seats** within **600 seconds**.
- Average arrival rate: `200,000 / 600 ≈ 333 purchase attempts/second`.
- Demand is **10 people per seat**. If attempts were evenly distributed, at most `20,000 / 600 ≈ 33 seat allocations/second` could succeed; actual attempts and demand will be bursty.
- For capacity planning, a 10x burst over the 10-minute average means about **3,300 queue/admission or hold attempts/second**. This is an explicit stress assumption; the provided facts do not specify request frequency or the exact burst shape.
- Keep event and seat-map reads on caches where possible. Put purchase attempts through a rate-limited virtual queue and size the allocation path for the burst assumption. Queue position and admission rates can be adjusted without weakening the database's seat-ownership constraint.

## 3. API

All endpoints are versioned under `/api/v1`. Authenticated endpoints require a user session or access token.

| Method and endpoint | Purpose |
|---|---|
| `GET /events?city=&date=&page=` | Search and paginate events. |
| `GET /events/{eventId}` | Read event, venue, and sale details. |
| `GET /events/{eventId}/seats` | Get a seat map and an availability snapshot; this snapshot is informational and can change before a hold is placed. |
| `POST /events/{eventId}/queue` | Join the sale queue and receive a queue token and position/status. |
| `POST /events/{eventId}/holds` | Request one or more seats using an idempotency key; succeeds only if every requested seat can be held. Returns a hold ID and expiration time. |
| `POST /holds/{holdId}/checkout` | Start payment for the caller's active hold and return a payment-provider checkout/intent reference. |
| `GET /orders/{orderId}` | Read order and ticket status for the authenticated owner. |
| `POST /holds/{holdId}/release` | Release an active hold early and return its seats to inventory. |

The hold endpoint returns `409 Conflict` if any requested seat is no longer available. A repeated request with the same idempotency key returns the original result rather than creating another hold.

## 4. Data model

The relational database is authoritative for seat ownership. Primary and foreign keys are shown below; timestamps are UTC.

| Table | Important columns and constraints |
|---|---|
| `users` | `user_id` (PK), `email` (unique), `created_at` |
| `events` | `event_id` (PK), `venue_id` (FK), `title`, `starts_at`, `sale_opens_at`, `status` |
| `event_seats` | `event_id` (FK), `seat_id`, `section`, `price`, `state` (`AVAILABLE`, `HELD`, `SOLD`), `hold_id` (nullable), `hold_expires_at` (nullable); composite PK (`event_id`, `seat_id`) |
| `holds` | `hold_id` (PK), `user_id` (FK), `event_id` (FK), `status`, `expires_at`, `idempotency_key`; unique (`user_id`, `idempotency_key`) |
| `hold_seats` | `hold_id` (FK), `event_id`, `seat_id`; composite PK (`hold_id`, `event_id`, `seat_id`), composite FK (`event_id`, `seat_id`) to `event_seats` |
| `orders` | `order_id` (PK), `user_id` (FK), `hold_id` (FK, unique), `status`, `payment_reference`, `created_at` |
| `tickets` | `ticket_id` (PK), `order_id` (FK), `event_id`, `seat_id`, `qr_token` (unique); unique (`event_id`, `seat_id`) |

Relationships: a user can create many holds and orders; an event has many event-seat inventory rows; a hold can cover many seats through `hold_seats`; a completed order belongs to one hold and can issue a ticket for each seat. The unique ticket constraint is a final safeguard against selling a seat twice.

### Preventing two people from buying the same seat

Creating a hold is one short database transaction. For each requested `(event_id, seat_id)`, the service conditionally changes the inventory row from `AVAILABLE` to `HELD`, assigning the new `hold_id` and expiration. The update succeeds only if the row is still available; the database serializes concurrent updates to that row, so only one transaction can win. All requested seats are updated together, or the transaction rolls back so a partial multi-seat hold is not left behind. A competing request gets a conflict response.

Expired holds are reclaimed by a worker using a conditional update that checks both `state = HELD` and the matching expired `hold_id`/expiration. Checkout likewise verifies that the hold is still active and owns every seat before changing them to `SOLD` and recording the order/tickets in a transaction. Payment is coordinated through an idempotent payment intent and a retryable reconciliation process; a payment callback alone never assigns a seat. The relational constraints and conditional writes—not a cache or distributed lock—enforce the no-double-booking invariant.

## 5. Architecture

```text
              200,000 customers attempt purchase within 10 minutes
                                    |
                    +---------------v----------------+
                    | CDN / Static Content Cache     |
                    | absorbs assets; no DB requests |
                    +---------------+----------------+
                                    |
                    +---------------v----------------+
                    | API Gateway                    |
                    | auth, request limits, routing  |
                    +-----------+--------------------+
                                |
                  +-------------+----------------------+
                  |                                    |
       browse/read|                         sale writes|
                  v                                    v
       +----------+-----------+             +----------+-----------+
       | Event / Seat-Map     |             | Virtual Queue        |
       | Read Cache           |             | admission + position |
       +----------+-----------+             +----+------------+----+
                  |                                |            |
             cache miss                      enqueue/status   queue
                  |                                |          position
                  v                                v            |
       +----------+-----------+             +------+------------v---+
       | Read API / Database  |             | Durable Queue Store   |
       | read replica or      |             | waiting users use no  |
       | bounded read pool    |             | ticket-DB connections |
       +----------------------+             +----------+------------+
                                                        |
                                        rate-limited, short-lived
                                           admission tokens
                                                        |
                                            +-----------v-----------+
                                            | Ticketing Service     |
                                            | bounded worker count  |
                                            | validates token       |
                                            +-----------+-----------+
                                                        |
                                            +-----------v-----------+
                                            | Bounded DB Pool       |
                                            | max connections /     |
                                            | transaction timeouts  |
                                            +-----------+-----------+
                                                        |
                                            +-----------v-----------+
                                            | Primary Relational DB |
                                            | atomic seat ownership |
                                            +-----+------------+----+
                                                  |            |
                                             outbox events   payment intent
                                                  |            v
                                                  v    +-------+----------+
                                        +---------+--+ | Payment Provider |
                                        | Async      | +------------------+
                                        | Workers    |
                                        | expiry,    |
                                        | tickets,   |
                                        | reconcile  |
                                        +------------+
```

- **CDN/static cache:** Serves scripts, images, and other static content at the edge, preventing those requests from reaching application servers or the database during the rush.
- **API gateway:** Authenticates, rate-limits, and routes requests. It rejects abusive or over-limit traffic early and keeps browsing and purchase traffic on separate paths so a sale spike does not consume every application slot.
- **Event/seat-map read cache:** Serves popular event details and seat-map snapshots from memory. A cache miss can use a bounded read path/read replica; the displayed availability is advisory and the primary database checks seat ownership again when a hold is created.
- **Virtual queue and durable queue store:** Accepts sale arrivals and stores waiting entries outside the ticketing database and its connection pool. The 200,000 customers are admitted at a controlled rate using short-lived, single-use tokens; users waiting for their turn read queue position/status without holding a ticket-service worker or database connection. Admission pauses when the downstream service is saturated.
- **Ticketing service:** Validates the admission token before doing allocation work. A bounded worker count limits simultaneous hold transactions, while idempotency keys make client retries safe. It does not create unbounded request tasks waiting while holding database connections.
- **Bounded database connection pool:** Places a hard ceiling on concurrent database sessions and uses transaction timeouts to release connections from stalled work. The queue's admission rate and ticketing worker limit are set at or below the capacity the pool and primary database can sustain; saturation applies backpressure to admission instead of creating an ever-growing database backlog.
- **Primary relational database:** Performs the short atomic seat-hold/order transactions and enforces unique seat ownership. Only admitted, bounded write traffic reaches it, preserving the consistency guarantee under overload.
- **Payment provider and asynchronous workers:** Payment is performed outside the seat-allocation transaction. Workers process outbox events, expire holds, issue tickets, and reconcile payment status with bounded concurrency and retries, so slow provider calls and notification work do not tie up the sale-time database pool.

## 6. Trade-offs

1. **Queue buffering versus direct database access:** A durable virtual queue and rate-limited token admission protect the bounded worker count and database connection pool from a 200,000-person arrival burst, but add queue infrastructure, operational tuning, and user wait time. Set admission below measured sustainable database throughput and pause it when workers/pool saturate. Too-conservative limits lengthen the queue and waste capacity; overly aggressive limits recreate pool exhaustion and database overload. Queue-store outages also require an explicit fail-closed or recovery policy rather than bypassing admission.
2. **Strong consistency versus availability for seat allocation:** Conditional writes and transactions against the primary database prevent two customers from holding the same seat, but a primary-database outage or contention can reject/slow purchases even if cached pages and queue status remain available. Using eventually consistent replicas for allocation would improve responsiveness but risks overselling; replicas are therefore limited to reads, and the primary rechecks ownership on every hold.
3. **Cached reads versus live availability:** Caching event details and seat maps reduces database read load during the sale, but availability can be stale and cache invalidation adds complexity. Display a snapshot timestamp and treat it only as a hint; the atomic hold operation is authoritative.
4. **Short holds versus checkout convenience:** A hold gives customers time to pay but temporarily removes inventory from others and needs expiry workers plus payment reconciliation. Short, explicit expirations reduce stranded seats, while overly short holds penalize customers with slow checkout or payment-provider delays.
