import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";

export interface EncryptedData {
  iv: string;
  ciphertext: string;
}

export interface RegisterVaultEntryRequest {
  AesHashKeyRecovery: EncryptedData;
  RecoverySalt: string;
  MasterSalt: string;
  AesHashKeyMaster: EncryptedData;
  MasterPasswordHash: string;
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function bytesToWordArray(bytes: Uint8Array) {
  return CryptoJS.lib.WordArray.create(bytes);
}

export async function generateRandomWordArray(length: number) {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return bytesToWordArray(randomBytes);
}

export async function generateRandomAESKey() {
  const keyBytes = await Crypto.getRandomBytesAsync(32); // 32 bytes = 256 bits
  return bytesToHex(keyBytes);
}

export async function generateSalt() {
  const saltBytes = await Crypto.getRandomBytesAsync(32);
  return bytesToHex(saltBytes);
}

export async function generateRecoveryKey() {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const hex = bytesToHex(bytes);
  return hex.match(/.{1,4}/g)?.join("-") || hex;
}

export function deriveMasterPasswordHash(
  masterPassword: string,
  userSaltHex: string,
): string {
  const salt = CryptoJS.enc.Hex.parse(userSaltHex);

  const key = CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 256 / 32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  });

  return key.toString(CryptoJS.enc.Hex);
}

export function deriveGoatKey(
  masterPassword: string,
  randomAESKeyHex: string,
  userSaltHex: string,
): string {
  const salt = CryptoJS.enc.Hex.parse(userSaltHex);

  const combinedSecret = randomAESKeyHex + masterPassword;

  const goatKey = CryptoJS.PBKDF2(combinedSecret, salt, {
    keySize: 256 / 32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  });

  return goatKey.toString(CryptoJS.enc.Hex);
}

export async function encryptAESKeyWithMasterPassword(
  randomAESKeyHex: string,
  masterPassword: string,
  userSaltHex: string,
): Promise<EncryptedData> {
  const masterKey = deriveMasterPasswordHash(masterPassword, userSaltHex);
  const key = CryptoJS.enc.Hex.parse(masterKey);
  const iv = await generateRandomWordArray(16);

  const encrypted = CryptoJS.AES.encrypt(randomAESKeyHex, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
  };
}

export function decryptAESKeyWithMasterPassword(
  encryptedData: EncryptedData,
  masterPassword: string,
  userSaltHex: string,
): string {
  const masterKey = deriveMasterPasswordHash(masterPassword, userSaltHex);
  const key = CryptoJS.enc.Hex.parse(masterKey);
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.ciphertext);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

export async function encryptAESKeyWithRecoveryKey(
  randomAESKeyHex: string,
  recoveryKey: string,
  recoveryKeySaltHex: string,
): Promise<EncryptedData> {
  const salt = CryptoJS.enc.Hex.parse(recoveryKeySaltHex);
  const derivedRecoveryKey = CryptoJS.PBKDF2(recoveryKey, salt, {
    keySize: 256 / 32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  });

  const key = CryptoJS.enc.Hex.parse(
    derivedRecoveryKey.toString(CryptoJS.enc.Hex),
  );
  const iv = await generateRandomWordArray(16);

  const encrypted = CryptoJS.AES.encrypt(randomAESKeyHex, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
  };
}

export function decryptAESKeyWithRecoveryKey(
  encryptedData: EncryptedData,
  recoveryKey: string,
  recoveryKeySaltHex: string,
): string {
  const salt = CryptoJS.enc.Hex.parse(recoveryKeySaltHex);
  const derivedRecoveryKey = CryptoJS.PBKDF2(recoveryKey, salt, {
    keySize: 256 / 32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  });

  const key = CryptoJS.enc.Hex.parse(
    derivedRecoveryKey.toString(CryptoJS.enc.Hex),
  );
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.ciphertext);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

export async function encryptPassword(
  password: string,
  goatKeyHex: string,
): Promise<EncryptedData> {
  const key = CryptoJS.enc.Hex.parse(goatKeyHex);
  const iv = await generateRandomWordArray(16);

  const encrypted = CryptoJS.AES.encrypt(password, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
  };
}

export function decryptPassword(
  encryptedData: EncryptedData,
  goatKeyHex: string,
): string {
  const key = CryptoJS.enc.Hex.parse(goatKeyHex);
  const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
  const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.ciphertext);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
