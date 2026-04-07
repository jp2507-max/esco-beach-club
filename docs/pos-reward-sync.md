# POS Reward Sync

This flow makes the restaurant POS the source of truth for reward claims.

## Canonical bill store

Instant entity: `pos_bills`

Primary identifiers:

- `id`: `pos-bill:{restaurant_id}:{pos_bill_id}`
- `canonical_bill_id`: same value, unique
- `entry_key`: same value, unique

Core fields:

- `restaurant_id`
- `pos_bill_id`
- `receipt_reference`
- `amount_vnd`
- `currency`
- `status`
- `paid_at`
- `closed_at`
- `source_updated_at`
- `last_synced_at`
- `claimed_at`
- `claimed_by_profile_id`
- `claimed_reward_transaction_id`

Reward eligibility:

- bill must exist in `pos_bills`
- `status` must be `PAID`
- `paid_at` must be set
- `claimed_at` / `claimed_reward_transaction_id` must be empty

## Local Windows agent

The iPOS SQL Server agent should run inside the restaurant network and only make outbound HTTPS requests to this backend.

Recommended sync cadence:

- poll every 5 to 10 seconds
- sync only bills changed since the last successful watermark
- retry with backoff when offline

Request:

- `POST /api/pos/bills/upsert`
- headers:
  - `x-esco-timestamp: <unix-ms>`
  - `x-esco-signature: <base64url(hmac_sha256(POS_SYNC_SHARED_SECRET, timestamp + "." + rawBody))>`

Body:

```json
{
  "bills": [
    {
      "restaurantId": "ESCO_DANANG",
      "posBillId": "BILL-1001",
      "receiptReference": "CHK-20260406-1001",
      "amountVnd": 450000,
      "currency": "VND",
      "status": "PAID",
      "paidAt": "2026-04-06T14:03:11.000Z",
      "closedAt": "2026-04-06T14:03:11.000Z",
      "sourceUpdatedAt": "2026-04-06T14:03:11.000Z",
      "terminalId": "BAR-01"
    }
  ]
}
```

Validation notes:

- `posBillId` must match `^[A-Za-z0-9._-]{1,128}$`
- when `status` is `PAID`, `paidAt` is required

Response:

```json
{
  "processed": 1,
  "upserted": 1
}
```

## Printed QR format

Printed by the local POS/agent, not the mobile app.

Compact payload:

```text
esco:bill:v1:{restaurantId}:{posBillId}:{signature}
```

Signature payload:

```text
esco:bill:v1:{restaurantId}:{posBillId}
```

Signature algorithm:

- `base64url(hmac_sha256(POS_BILL_QR_SECRET, signingPayload))`

Example:

```text
esco:bill:v1:ESCO_DANANG:BILL-1001:4J5...base64url...
```

The QR should identify the bill only. It must not be the source of truth for the amount.

## Member claim API

Route:

- `POST /api/rewards/claim`

Headers:

- `Authorization: Bearer <instant_refresh_token>`

Body:

```json
{
  "qrData": "esco:bill:v1:ESCO_DANANG:BILL-1001:..."
}
```

Server flow:

1. verify member refresh token
2. parse QR payload
3. verify QR HMAC with `POS_BILL_QR_SECRET`
4. resolve `pos_bills` by `restaurant_id + pos_bill_id`
5. require `PAID`
6. reject already claimed bills
7. calculate points from canonical `amount_vnd`
8. create `reward_transactions`
9. mark `pos_bills.claimed_*`

Important trust boundary:

- app provides scanned bill reference
- backend provides authenticated member identity
- POS sync provides canonical bill amount and payment state

The app never decides the bill amount.
