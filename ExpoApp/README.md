# goPass Mobile (Expo)

goPass is a zero-knowledge password manager built with Expo Router and React Native. All vault secrets are encrypted on-device with AES-256 before they ever travel over the network, while biometrics, recovery codes, and device registration provide layered protection.

## Tech stack
- **Runtime:** Expo + React Native, Expo Router file-based navigation (`app/(tabs)`)
- **State/Data:** TanStack Query, custom Axios wrapper with automatic token refresh
- **Native services:** Expo SecureStore for key storage, Expo Crypto for random bytes/PBKDF2, Expo Local Authentication, Expo Clipboard
- **UI:** React Native Paper, NativeWind/Tailwind utility classes, Toastify React Native

## High-level architecture & flows
### Screen modules
| Module | File | Responsibilities |
| --- | --- | --- |
| Auth | `app/(tabs)/auth.tsx` | Registration/login, recovery modal, device registration, mutation orchestration |
| Vault | `app/(tabs)/home.tsx` | Lists encrypted entries, breach status, detail modal with biometric-gated reveal, CRUD |
| Add Password | `app/(tabs)/add.tsx` | Password generator, metadata capture, AES encryption before upload |
| Profile & Devices | `app/(tabs)/profile.tsx`, `devices.tsx` | Account management, biometrics toggle, device revocation, logout |

### Encryption path (why the server cannot decrypt)
1. **Client derives secrets:** During registration (`auth.tsx`), the device creates a random 256-bit AES key plus unique salts. PBKDF2 (SHA-256, 1,000 iterations) derives:
   - `masterPasswordHash` (stored server-side for login only)
   - GOAT key (master password + AES key + salt) used to encrypt vault passwords
2. **Key wrapping:** The random AES key is encrypted twice—once with the master password (`aesHashKeyMaster`) and once with the recovery code (`aesHashKeyRecovery`). Only the encrypted blobs and salts leave the device.
3. **Server storage:** Backend databases hold ciphertext, IVs, salted hashes, and metadata. They never receive the plaintext master password, GOAT key, or AES key, so even with full DB access attackers can’t decrypt vault contents.
4. **Decryption:** When a user logs in, the device re-derives the GOAT key locally (using the stored AES key in SecureStore or by decrypting it with the recovery code) and decrypts passwords entirely offline. Biometric checks guard plaintext reveal/copy operations.

Because the backend stores only salted hashes and encrypted material, it has zero knowledge of user secrets and cannot decrypt them—even administrators would need the user’s master password or recovery code, which never leaves the device.

### Password lifecycle
- **Registration:** Generate AES key + salts → encrypt AES key with password & recovery code → send hashes + ciphertext to `/auth/register`.
- **Login:** Authenticate with email/password → store JWTs + register device → if local AES key missing, fetch encrypted recovery blob and decrypt with user-provided recovery code.
- **Add/Edit Vault Entry:** Pull AES key from SecureStore → encrypt password + IV with GOAT key → send ciphertext, IV, SHA-1 hash (for breach lookups) to `/vault/*` endpoints via Axios wrapper.
- **Viewing/Copying:** Require biometric pass, decrypt locally, optionally copy to clipboard for a limited time.

## Local development
```bash
cd ExpoApp
npm install
npx expo start   # choose iOS simulator, Android emulator, or Expo Go
```
Environment prerequisites: Node 18+, Expo CLI, an emulator/simulator, and the backend reachable at the IP defined in `utils/AxiosWrapper.tsx` (`API_URL`).

## Configuration & environment variables
- **API base URL:** Currently hard-coded (`http://192.168.18.26:8080`) in `utils/AxiosWrapper.tsx` and `app/(tabs)/auth.tsx`. Before building for production, move this into typed Expo env (`app.config.ts` → `extra.apiUrl`) or use `expo-constants` so you can switch endpoints per release channel without code edits.
- **Secrets at build time:** Expo bundlers inline `process.env` values. To avoid re-building just to rotate URLs/feature flags, prefer runtime config fetched from your backend, or store environment-specific values in EAS secrets + `app.config.ts` `process.env.MY_VAR`.
- **Binary builds:** When generating an .apk/.aab/.ipa, whatever config is compiled in becomes immutable until the next build. Plan a config mechanism (remote config, feature flag doc) so endpoint changes don’t force App/Play Store submissions.

## OTA updates vs. store releases
- **Expo Updates (EAS Update):** You can push JavaScript/asset-only fixes (UI tweaks, bug fixes, text changes, feature flags) instantly without rebuilding binaries. Use `eas update` to deploy these; devices will pull the update on next app load.
- **When a new store build is required:** Adding/removing native modules, changing permissions, updating icons/splash, or modifying anything in `android/` or `ios/` requires a new binary submission. Also, if your env config is baked into native code (e.g., new scheme, deep links), you must ship a full update.
- **Backend outages:** If the backend crashes, you fix/redeploy the backend—no store or OTA update is necessary unless the fix requires code changes in the client. Consider graceful error states (already implemented with React Query error handlers) and optionally show maintenance banners driven by an API flag.

## Failure & recovery scenarios
- **Backend downtime:** Axios wrapper surfaces errors; React Query can show toast/alerts. No store release is needed—restore the API and clients will work immediately.
- **Missing local AES key:** Profile screen provides “Clear Local Encryption Key,” and login flow prompts for the recovery code to rehydrate it.
- **Device compromise:** Users can revoke devices from Profile/Devices screens; the backend token refresh flow ensures old tokens become invalid after revocation.

## Deployment checklist
1. **QA the JS bundle** on preview channels (`eas update --branch preview`).
2. **Bake production config** (API URLs, feature flags) via `app.config.ts` + EAS secrets.
3. **Create production builds** with `eas build --platform android/ios` when native changes occur; otherwise rely on OTA updates.
4. **Monitor**: instrument backend health; expose maintenance flags so the client can switch endpoints or show downtime copy without publishing a new binary.

## Security reminders
- Protect the recovery code; it’s the only way to decrypt the wrapped AES key if SecureStore is cleared.
- Keep PBKDF2 iteration counts balanced: 1,000 iterations is fine for mobile UX, but consider increasing once performance budgets allow.
- Never log secrets (ensure Axios interceptor console logs are disabled for production).
- Treat SHA-1 breach hashes as opaque: they are only for “Have I Been Pwned” style lookups and do not weaken encryption.

With this architecture, the backend database only ever sees salted hashes and ciphertext, so a database leak does not expose actual passwords—the attacker would still need the user’s master password or recovery code plus device-held AES key to decrypt anything.
