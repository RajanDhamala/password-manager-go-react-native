#  goPass - Password Manager

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"/>
  <img src="https://img.shields.io/badge/Fiber-00ACD7?style=for-the-badge&logo=go&logoColor=white" alt="Fiber"/>
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

<p align="center">
  A secure, full-stack password manager with a <b>Go backend</b> and <b>React Native mobile app</b>.
</p>

---

##  Features

-  **End-to-end encryption** - Passwords encrypted client-side with AES-256
-  **Zero-knowledge architecture** - Server never sees plaintext passwords
-  **Blazing fast API** - Powered by Go Fiber
-  **Cross-platform mobile app** - iOS & Android via Expo
-  **Secure authentication** - JWT with refresh tokens
-  **Device management** - Track & revoke sessions
-  **Modern UI** - NativeWind (Tailwind for RN)

---

##  Tech Stack

### Backend

| | Technology | Purpose |
|--|------------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="20"/> | **Go 1.21+** | Backend language |
| ⚡ | **Fiber v2** | Web framework |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="20"/> | **PostgreSQL** | Database |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="20"/> | **GORM** | ORM |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/openssl/openssl-original.svg" width="20"/> | **HMAC-SHA256** | Token signing |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="20"/> | **bcrypt** | Password hashing |

---

### Mobile (ExpoApp)

| | Technology | Purpose |
|--|------------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20"/> | **React Native** | Mobile framework |
| <img src="https://www.vectorlogo.zone/logos/expoio/expoio-icon.svg" width="20"/> | **Expo** | Development & build |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20"/> | **TypeScript** | Type safety |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" width="20"/> | **NativeWind** | Styling (Tailwind) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="20"/> | **CryptoJS** | AES-256 encryption |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20"/> | **expo-secure-store** | Secure key storage |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20"/> | **TanStack Query** | Data fetching |


---

##  Project Structure

```
├── 🔧 goPass/                  # Go Backend
│   ├── main.go                 # Entry point (Fiber setup, CORS, routes)
│   ├── config/
│   │   └── database.go         # PostgreSQL connection via GORM
│   ├── controller/
│   │   ├── authcontroller.go   # Register, Login, Profile, Refresh
│   │   ├── vaultcontroller.go  # Create, Read, Update, Delete vault entries
│   │   ├── devicecontroller.go # Device registration & management
│   │   └── appcontroller.go    # App-specific handlers
│   ├── middlewares/
│   │   ├── appMiddle.go        # JWT auth middleware (validates access token)
│   │   └── authmiddle.go       # Additional auth middleware
│   ├── models/
│   │   ├── user.go             # User & Post models (legacy)
│   │   └── app.go              # AppUser, Device, VaultEntry models
│   ├── routes/
│   │   ├── authRoute.go        # /auth/* endpoints
│   │   ├── vault.go            # /vault/* endpoints
│   │   ├── device.go           # /device/* endpoints
│   │   └── userRoute.go        # /user/* endpoints
│   └── utils/
│       ├── apputils.go         # JWT creation & verification (HMAC-SHA256)
│       └── utils.go            # General utilities
│
└── 📱 ExpoApp/                 # React Native App
    ├── app/                    # Screens (Expo Router)
    │   ├── _layout.tsx         # Root layout (QueryClient, PaperProvider)
    │   ├── index.tsx           # Entry redirect
    │   └── [tabs]/             # Drawer navigation
    │       ├── _layout.tsx     # Drawer layout with custom sidebar
    │       ├── home.tsx        # Password list view
    │       ├── add.tsx         # Add new password (encrypts before sending)
    │       ├── auth.tsx        # Login/Register (generates AES key)
    │       ├── profile.tsx     # User profile
    │       ├── security.tsx    # Security settings
    │       └── settings.tsx    # App settings
    ├── components/
    │   ├── Add-password-modal.tsx
    │   ├── Password-card.tsx
    │   ├── Password-details-modal.tsx
    │   └── Platformicons.tsx
    └── utils/
        ├── crypto.ts           # AES-256, PBKDF2, encryption/decryption
        ├── AxiosWrapper.tsx    # Axios with JWT interceptor & refresh
        ├── securityHelpers.ts  # Helper wrappers for crypto functions
        └── clipboard.ts        # Clipboard utilities
```

---

##  Database Schema (DO NOT MODIFY)

### AppUser
```go
type AppUser struct {
    ID                 uuid.UUID      // Primary key
    Email              string         // Unique, indexed
    Password           string         // bcrypt hashed
    MasterPasswordHash string         // For vault unlock verification
    FullName           string
    ProfilePicture     string
    AesHashKeyMaster   datatypes.JSON // Encrypted AES key (master password)
    MasterSalt         *string        // Salt for master password derivation
    AesHashKeyRecovery datatypes.JSON // Encrypted AES key (recovery key)
    RecoverySalt       *string        // Salt for recovery key derivation
    Devices            []Device       // One-to-many
    VaultEntries       []VaultEntry   // One-to-many
    CreatedAt, UpdatedAt, DeletedAt
}
```

### VaultEntry
```go
type VaultEntry struct {
    ID                uuid.UUID      // Primary key
    UserID            uuid.UUID      // Foreign key to AppUser
    PlatformName      string         // e.g., "Gmail", "GitHub"
    EntryKey          string         // Title/identifier
    EncryptedPassword []byte         // AES-256 encrypted (CLIENT-SIDE)
    IV                []byte         // Initialization vector for AES
    MetaData          datatypes.JSON // {category, tags, email, etc.}
    CreatedAt, UpdatedAt
    Deleted           bool
}
```

### Device
```go
type Device struct {
    ID              uuid.UUID // Primary key
    UserID          uuid.UUID // Foreign key to AppUser
    DeviceName      string
    DevicePublicKey string    // For future E2E sync
    LastSyncAt      time.Time
    CreatedAt       time.Time
}
```

---

##  Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Expo App)                           │
│  ┌──────────────┐                                                   │
│  │ User enters  │                                                   │
│  │  password    │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Retrieve AES key from SecureStore (generated at login)    │  │
│  │ 2. Generate random 16-byte IV                                │  │
│  │ 3. Encrypt password with AES-256-CBC                         │  │
│  │ 4. Send {encryptedPassword, iv, metadata} to server          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER (Go Backend)                            │
│                                                                     │
│  ✅ Receives ONLY encrypted data                                    │
│  ✅ Stores encrypted bytes in PostgreSQL                            │
│  ✅ NEVER sees plaintext passwords (Zero-Knowledge)                 │
│  ✅ JWT authentication (Access: 30s, Refresh: 7 days)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Encryption Flow (crypto.ts)

1. **Login**: Generate random 256-bit AES key, store in `expo-secure-store`
2. **Add Password**:
   - `encryptPassword(plaintext, aesKey)` → `{iv: hex, ciphertext: hex}`
   - Convert hex to byte arrays for Go backend
   - POST to `/vault/add`
3. **View Password**:
   - Fetch encrypted data from server
   - `decryptPassword({iv, ciphertext}, aesKey)` → plaintext

### Key Functions (utils/crypto.ts)

| Function | Purpose |
|----------|---------|
| `generateRandomAESKey()` | Creates 256-bit key (stored locally) |
| `encryptPassword(password, aesKey)` | AES-256-CBC encryption |
| `decryptPassword(encrypted, aesKey)` | AES-256-CBC decryption |
| `deriveMasterPasswordHash(password, salt)` | PBKDF2 for auth |
| `deriveGoatKey(password, aesKey, salt)` | Combined key derivation |

---

## 🌐 API Reference

### Authentication (`/auth`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` | `{email, password, fullname}` | `{message}` |
| POST | `/auth/login` | `{email, password}` | `{accessToken, refreshToken}` |
| GET | `/auth/profile` | - (Auth header) | `{data: AppUser}` |
| GET | `/auth/refresh` | - (Refresh token in header) | `{newToken}` |

### Vault (`/vault`) - All require Auth header

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/vault/items` | - | `{data: VaultEntry[]}` |
| POST | `/vault/add` | `{platformname, entrykey, encyptedpassword, iv, metadata}` | `{data: VaultEntry}` |
| PUT | `/vault/update` | `{id, entrykey, platformname}` | `{data: VaultEntry}` |
| DELETE | `/vault/delete/:vaultId` | - | `{message}` |

### Devices (`/device`) - All require Auth header

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/device/register` | `{deviceName, devicePublicKey}` | `{data: Device}` |
| GET | `/device/list` | - | `{data: Device[]}` |
| DELETE | `/device/revoke/:id` | - | `{message}` |

---

##  Quick Start

### Backend Setup

```bash
cd goPass

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=yourpassword
DB_NAME=gopass
PORT=8080
EOF

# Install dependencies
go mod tidy

# Run server
go run main.go
```

### Mobile Setup

```bash
cd ExpoApp

# Install dependencies
npm install

# Update API URL in utils/AxiosWrapper.tsx
# baseURL: "http://YOUR_IP:8080"

# Start Expo
npx expo start
```

---

##  Important Notes

1. **AES Key Storage**: The encryption key is stored locally in `expo-secure-store` and NEVER sent to the server
2. **Password Flow**: `User types password → AES encrypt on device → Send encrypted bytes → Server stores bytes`
3. **Token Refresh**: Access tokens expire in 30 seconds (configurable in `apputils.go`), auto-refresh via Axios interceptor
4. **CORS**: Configured to allow all origins (`*`) - restrict in production

---

##  Docker

```bash
cd goPass
docker build -t gopass-api .
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=postgres \
  -e DB_PASS=yourpassword \
  -e DB_NAME=gopass \
  -e DB_PORT=5432 \
  gopass-api
```

---

<p align="center">
  Made with ❤️ using Go & React Native
</p>
