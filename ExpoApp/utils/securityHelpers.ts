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
} from "./crypto";

import { EncryptedData } from "./crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export const generateAesSaltRecovery = async () => {
  const aesKey = await generateRandomAESKey();
  const userSalt = await generateSalt();
  const recoveryKey = await generateRecoveryKey();
  return { aesKey, userSalt, recoveryKey };
};

export const generateGoatKey = (
  masterPassword: string,
  aesKey: string,
  userSalt: string,
) => {
  return deriveGoatKey(masterPassword, aesKey, userSalt);
};

export const encryptAesKeyMaster = async (
  aesKey: string,
  masterPassword: string,
  userSalt: string,
): Promise<EncryptedData> => {
  return encryptAESKeyWithMasterPassword(aesKey, masterPassword, userSalt);
};

export const encryptAesKeyRecovery = async (
  aesKey: string,
  recoveryKey: string,
  recoverySalt: string,
): Promise<EncryptedData> => {
  return encryptAESKeyWithRecoveryKey(aesKey, recoveryKey, recoverySalt);
};

export const decryptAesKeyMaster = (
  encryptedData: EncryptedData,
  masterPassword: string,
  userSalt: string,
): string => {
  return decryptAESKeyWithMasterPassword(
    encryptedData,
    masterPassword,
    userSalt,
  );
};

export const decryptAesKeyRecovery = (
  encryptedData: EncryptedData,
  recoveryKey: string,
  recoverySalt: string,
): string => {
  return decryptAESKeyWithRecoveryKey(encryptedData, recoveryKey, recoverySalt);
};

// Master password hash (for authentication)
export const hashMasterPassword = (
  masterPassword: string,
  userSalt: string,
): string => {
  return deriveMasterPasswordHash(masterPassword, userSalt);
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const biometricsEnabled =
      await SecureStore.getItemAsync("biometricsEnabled");

    if (biometricsEnabled !== "true") {
      return true;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return true; // Skip if not available
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to view password",
      fallbackLabel: "Use passcode",
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error("Biometric auth error:", error);
    return false;
  }
};
