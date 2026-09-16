# Auth-Gated App Testing Playbook (Budget Yaatra)

This app uses Phone Number OTP Authentication (`/api/auth/send-otp` and `/api/auth/verify-otp`).

## Step 1: Send OTP
```bash
curl -X POST "http://localhost:8000/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'
```
Response:
```json
{
  "message": "OTP sent to +91 98765 43210",
  "phone_number": "+91 98765 43210",
  "debug_otp": "482910"
}
```

## Step 2: Verify OTP & Create Session
```bash
curl -X POST "http://localhost:8000/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210", "otp": "482910", "name": "Rahul Sharma"}'
```
Note: Demo/Master OTP `123456` can also be used for rapid testing.

## Step 3: Test Authenticated Endpoints
```bash
curl -X GET "http://localhost:8000/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
curl -X GET "http://localhost:8000/api/wishlist" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Checklist
- [x] Phone number normalized to standard format (+91 XXXXX XXXXX)
- [x] OTP stored in `db.otps` with 10-min expiration
- [x] User doc has `user_id` and `phone_number`
- [x] Session token set in HTTP-Only cookie `session_token` and returned in response
- [x] Backend accepts both cookie and Authorization header
