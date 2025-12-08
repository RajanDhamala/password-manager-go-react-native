# goPass API (Go + Fiber) for Mobile Password Manager

Backend API for a mobile password manager app.

<p align="left">
  <img src="https://raw.githubusercontent.com/golang-samples/gopher-vector/master/gopher-front.svg" alt="Go" height="48" />
  &nbsp;&nbsp;
  <img src="https://reactnative.dev/img/header_logo.svg" alt="React Native" height="48" />
</p>

- **Language:** Go
- **Framework:** Fiber (v2)
- **ORM:** GORM
- **Use case:** Practice building a low-latency backend to be used by a React Native app

---

## Why Go (for learning)

- **Simple language:** Small feature set, easy to read and reason about.
- **Fast by default:** Compiled, efficient garbage collector, good performance without much tuning.
- **Great for concurrency:** Goroutines and channels make it easier to learn how to handle many requests at once.
- **Strong tooling:** `go fmt`, `go test`, `go vet`, and `go mod` are built in.

These points make Go a good language to learn systems and backend concepts (even if this password manager itself doesn’t need massive scale yet).

---

## Why Fiber

- **Low latency:** Built on top of `fasthttp`, focuses on speed.
- **Express-style API:** Familiar if you’ve used Node/Express.
- **Lightweight:** Simple middleware and routing, easy to understand the request flow.

This fits well for a mobile API where you want fast responses to simple JSON requests.

---

## Project Structure (API side)

```text
.
├── main.go          # Entry point (Fiber app, CORS, routes, AutoMigrate)
├── config/          # Database config (GORM)
├── controller/      # Route handlers (auth, user, device, vault, app)
├── middlewares/     # App + auth middlewares
├── models/          # GORM models (AppUser, Device, VaultEntry, etc.)
├── routes/          # Route registration
├── utils/           # Helper functions
└── Dockerfile       # Container build for the API
```

The API is designed to be consumed by a React Native mobile app (password manager client).

---

## Quick Start

1. **Install dependencies**

```bash
go mod tidy
```

2. **Set environment variables** (or use a `.env` file, see `main.go` / `config/database.go`):

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=gopass
DB_SSLMODE=disable
JWT_SECRET=your_jwt_secret
```

3. **Run the API**

```bash
go run main.go
```

The server listens on `http://localhost:8080` by default.

---

## High-Level API (for React Native client)

> Exact endpoints are defined in the `routes/` and `controller/` packages. This is a summary.

- **Auth**
  - Register, login, and get a token
- **Users**
  - Fetch and update the current user
- **Devices**
  - Register/list/delete devices linked to a user
- **Vault**
  - CRUD operations for password/secret entries

The React Native app will typically:

1. Call auth endpoints to get a JWT/token.
2. Store the token securely on the device.
3. Send the token in `Authorization: Bearer <token>` for protected routes.

---

## Latency / Performance Notes (rough expectations)

These are ballpark expectations for a simple Go + Fiber API (not official benchmarks):

- Able to handle many concurrent requests using goroutines.
- p50 latency often in a few milliseconds for simple JSON CRUD on a local DB.
- Good base to learn about:
  - DB query optimization
  - Connection pooling
  - Middleware overhead

Use this project mainly to **learn**:

- How HTTP APIs are structured in Go.
- How ORMs like GORM map structs to tables.
- How to keep request/response paths simple and fast.

---

## Next Steps

- Document each endpoint with example requests/responses.
- Add tests for controllers and middlewares.
- Integrate fully with the React Native client and measure real latency from a device.

