
import {
  generateRandomAESKey,
  decryptAESKeyWithMasterPassword,
  encryptAESKeyWithRecoveryKey,
  encryptAESKeyWithMasterPassword,
  decryptAESKeyWithRecoveryKey,
  deriveGoatKey,
  generateSalt,
  generateRecoveryKey,
  deriveMasterPasswordHash,
  EncryptedData
} from "./crypto";

export const generateAesSaltRecovery = () => {
  const aesKey = generateRandomAESKey();
  const userSalt = generateSalt();
  const recoveryKey = generateRecoveryKey();
  return { aesKey, userSalt, recoveryKey };
};

export const generateGoatKey = (masterPassword: string, aesKey: string, userSalt: string) => {
  return deriveGoatKey(masterPassword, aesKey, userSalt);
};

export const encryptAesKeyMaster = (aesKey: string, masterPassword: string, userSalt: string): EncryptedData => {
  return encryptAESKeyWithMasterPassword(aesKey, masterPassword, userSalt);
};

export const encryptAesKeyRecovery = (aesKey: string, recoveryKey: string, recoverySalt: string): EncryptedData => {
  return encryptAESKeyWithRecoveryKey(aesKey, recoveryKey, recoverySalt);
};

export const decryptAesKeyMaster = (encryptedData: EncryptedData, masterPassword: string, userSalt: string): string => {
  return decryptAESKeyWithMasterPassword(encryptedData, masterPassword, userSalt);
};

export const decryptAesKeyRecovery = (encryptedData: EncryptedData, recoveryKey: string, recoverySalt: string): string => {
  return decryptAESKeyWithRecoveryKey(encryptedData, recoveryKey, recoverySalt);
};

// Master password hash (for authentication)
export const hashMasterPassword = (masterPassword: string, userSalt: string): string => {
  return deriveMasterPasswordHash(masterPassword, userSalt);
};

