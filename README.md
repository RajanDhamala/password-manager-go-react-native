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

-  **End-to-end encryption** - Passwords encrypted client-side
-  **Blazing fast API** - Powered by Go Fiber
-  **Cross-platform mobile app** - iOS & Android via Expo
-  **Secure authentication** - JWT with refresh tokens
-  **Device management** - Track & revoke sessions
-  **Modern UI** - NativeWind (Tailwind for RN)

---

## 🛠 Tech Stack

### Backend

| | Technology | Purpose |
|--|------------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="20"/> | **Go** | Backend language |
| ⚡ | **Fiber v2** | Web framework |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="20"/> | **PostgreSQL** | Database |
| 🗃️ | **GORM** | ORM |
| 🔐 | **JWT** | Authentication |

### Mobile

| | Technology | Purpose |
|--|------------|---------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20"/> | **React Native** | Mobile framework |
| <img src="https://www.vectorlogo.zone/logos/expoio/expoio-icon.svg" width="20"/> | **Expo** | Development & build |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20"/> | **TypeScript** | Type safety |
| 🎨 | **NativeWind** | Styling |
| 🔒 | **CryptoJS** | Encryption |

---

## 📁 Project Structure

```
├── 🔧 goPass/                  # Go Backend
│   ├── main.go                 # Entry point
│   ├── config/
│   │   └── database.go         # PostgreSQL connection
│   ├── controller/
│   │   ├── authcontroller.go   # Auth handlers
│   │   ├── vaultcontroller.go  # Vault CRUD
│   │   ├── devicecontroller.go # Device management
│   │   └── userController.go   # User operations
│   ├── middlewares/
│   │   └── authmiddle.go       # JWT validation
│   ├── models/
│   │   ├── user.go             # User model
│   │   └── app.go              # Vault model
│   ├── routes/                 # Route definitions
│   └── utils/                  # Helpers & JWT
│
└── 📱 ExpoApp/                 # React Native App
    ├── app/                    # Screens (Expo Router)
    │   ├── _layout.tsx         # Root layout
    │   └── [tabs]/             # Tab navigation
    │       ├── home.tsx        # Password list
    │       ├── add.tsx         # Add password
    │       ├── profile.tsx     # User profile
    │       ├── security.tsx    # Security settings
    │       └── settings.tsx    # App settings
    ├── components/
    │   ├── Password-card.tsx   # Password item
    │   ├── Add-password-modal.tsx
    │   └── Password-details-modal.tsx
    └── utils/
        ├── crypto.ts           # Encryption utils
        ├── AxiosWrapper.tsx    # API client
        └── securityHelpers.ts  # Security utils
```

---

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Expo CLI

### Backend Setup

```bash
cd goPass

# Install dependencies
go mod tidy

# Set environment variables
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASS=yourpassword
export DB_NAME=gopass
export DB_PORT=5432
export JWT_SECRET=your-secret-key

# Run server
go run main.go
```

### Mobile Setup

```bash
cd ExpoApp

# Install dependencies
npm install

# Start development server
npx expo start
```

> 📝 Update API URL in `utils/AxiosWrapper.tsx`

---

##  API Endpoints

###  Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/profile` | Get profile |
| `GET` | `/auth/refresh` | Refresh token |
| `POST` | `/auth/logout` | Logout |

###  Vault

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/vault/items` | List passwords |
| `POST` | `/vault/add` | Add password |
| `PUT` | `/vault/update` | Update password |
| `DELETE` | `/vault/delete/:id` | Delete password |

###  Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/device/register` | Register device |
| `GET` | `/device/list` | List devices |
| `DELETE` | `/device/revoke/:id` | Revoke device |

---

##  Security

```
┌────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                           │
│  ┌──────────────┐    ┌─────────┐    ┌──────────────────┐  │
│  │ Master Pass  │───▶│ PBKDF2  │───▶│ AES-256 Encrypt  │  │
│  └──────────────┘    └─────────┘    └──────────────────┘  │
│                                              │             │
│                                              ▼             │
│                                     Encrypted Payload      │
└────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────┐
│                      SERVER SIDE                           │
│           Stores only encrypted data (zero-knowledge)      │
└────────────────────────────────────────────────────────────┘
```

- ✅ Client-side encryption with AES-256
- ✅ PBKDF2 key derivation
- ✅ Zero-knowledge architecture
- ✅ JWT with HTTP-only cookies
- ✅ Secure token refresh flow

---

## 🐳 Docker

```bash
cd goPass
docker build -t gopass-api .
docker run -p 8080:8080 gopass-api
```

---

## 📸 Screenshots

*Coming soon...*

---

## 📝 License

MIT License - feel free to use this project!

---

<p align="center">
  Made with ❤️ using Go & React Native
</p>

<p align="center">
  <a href="https://github.com/RajanDhamala/password-manager-go-react-native">
    <img src="https://img.shields.io/github/stars/RajanDhamala/password-manager-go-react-native?style=social" alt="GitHub stars"/>
  </a>
</p>

