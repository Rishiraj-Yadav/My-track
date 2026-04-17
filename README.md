# MyTracker Backend

MongoDB + Express + TypeScript backend for the MyTracker frontend.

The frontend uses `POST /api/bootstrap` with a browser session ID to create or reuse an anonymous MongoDB-backed workspace, then reads and writes the rest of the data through the API.

## Env keys

Create a `.env` file from `.env.example` with:

- `PORT`
- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `BCRYPT_SALT_ROUNDS`

## Run

```bash
npm install
npm run dev
```
