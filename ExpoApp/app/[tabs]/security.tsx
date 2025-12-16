
import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";

import {
  generateAesSaltRecovery,
  generateGoatKey,
  encryptAesKeyMaster,
  encryptAesKeyRecovery,
  decryptAesKeyMaster,
  decryptAesKeyRecovery,
} from "../../utils/securityHelpers";
import { EncryptedData, generateSalt } from "../../utils/crypto"

const SecurityComponent = () => {
  const [masterPassword, setMasterPassword] = useState("");
  const [aesKey, setAesKey] = useState("");
  const [userSalt, setUserSalt] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [goatKey, setGoatKey] = useState("");
  const [encryptedMaster, setEncryptedMaster] = useState<EncryptedData | null>(null);
  const [encryptedRecovery, setEncryptedRecovery] = useState<EncryptedData | null>(null);
  const [recoverySalt, setRecoverySalt] = useState("")

  const initializeSecurity = async () => {
    let storedAES = await SecureStore.getItemAsync("aesKey");
    let storedUserSalt = await SecureStore.getItemAsync("userSalt");
    let storedRecovery = await SecureStore.getItemAsync("recoveryKey");

    if (!storedAES || !storedUserSalt || !storedRecovery) {
      const { aesKey: newAES, userSalt: salt, recoveryKey: recKey } = await generateAesSaltRecovery();
      setAesKey(newAES);
      setUserSalt(salt);
      setRecoveryKey(recKey);

      await SecureStore.setItemAsync("aesKey", newAES);
      await SecureStore.setItemAsync("userSalt", salt);
      await SecureStore.setItemAsync("recoveryKey", recKey);

      console.log("AES Key generated:", newAES);
      console.log("User Salt generated:", salt);
      console.log("Recovery Key generated:", recKey);
    } else {
      setAesKey(storedAES);
      setUserSalt(storedUserSalt);
      setRecoveryKey(storedRecovery);

      console.log("AES Key loaded:", storedAES);
      console.log("User Salt loaded:", storedUserSalt);
      console.log("Recovery Key loaded:", storedRecovery);
    }
  };
  const handleGenerateGoatKey = () => {
    if (!masterPassword || !aesKey || !userSalt) {
      Alert.alert("Error", "Master password, AES key, and salt must be present.");
      return;
    }
    console.log("generating goat key")
    try {
      const goat = generateGoatKey(masterPassword, aesKey, userSalt);
      setGoatKey(goat);
      console.log("goatKey:", goat)
    } catch (error) {
      console.log("failed to generate goatkey", error)
    }
  };



  const handleEncryptMaster = async () => {
    if (!masterPassword || !aesKey || !userSalt) return;
    const enc = await encryptAesKeyMaster(aesKey, masterPassword, userSalt);
    setEncryptedMaster(enc);
    console.log("Encrypted Aesviamaster:", enc)
  };

  const handleDecryptMaster = () => {
    if (!encryptedMaster || !masterPassword) return;
    const decrypted = decryptAesKeyMaster(encryptedMaster, masterPassword, userSalt);
    console.log("Descrypted MasterviaAes:", decrypted)
    Alert.alert("Decrypted AES Key (Master)", decrypted);
  };

  const handleEncryptRecovery = async () => {
    if (!recoveryKey || !aesKey || !userSalt) return;
    const recoverySalt = await generateSalt();
    setRecoverySalt(recoverySalt)
    const enc = await encryptAesKeyRecovery(aesKey, recoveryKey, recoverySalt);
    setEncryptedRecovery(enc);
    console.log("encryptedRecoveryviaAes", enc)
  };
  const handleDecryptRecovery = () => {
    if (!encryptedRecovery || !recoveryKey) return;
    const decrypted = decryptAesKeyRecovery(encryptedRecovery, recoveryKey, recoverySalt);
    console.log("Decrypted RecoveryviaAes:", decrypted)
    Alert.alert("Decrypted AES Key (Recovery)", decrypted);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f9f9f9", flexGrow: 1 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>
          🔐 Security Dashboard
        </Text>

        <View style={{ marginBottom: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Master Password</Text>
          <TextInput
            value={masterPassword}
            onChangeText={setMasterPassword}
            secureTextEntry
            placeholder="Enter master password"
            style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: "#f0f0f0" }}
          />
          <Button title="Generate GOAT Key 🔑" onPress={handleGenerateGoatKey} />
        </View>

        <View style={{ marginBottom: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
          <Button title="Initialize AES, Salt & Recovery" onPress={initializeSecurity} />
          <Text style={{ marginTop: 8 }}>AES Key: {aesKey ? " Loaded" : " Not loaded"}</Text>
          <Text>User Salt: {userSalt || ""}</Text>
          <Text>Recovery Key: {recoveryKey || ""}</Text>
        </View>

        {goatKey && (
          <View style={{ marginBottom: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
            <Text>GOAT Key: {goatKey.slice(0, 16)}... (hidden)</Text>
          </View>
        )}

        <View style={{ marginBottom: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
          <Button title="Encrypt AES with Master" onPress={handleEncryptMaster} />
          <View style={{ marginTop: 8 }} />
          <Button title="Decrypt AES with Master" onPress={handleDecryptMaster} />
          <View style={{ marginTop: 8 }} />
          <Button title="Encrypt AES with Recovery" onPress={handleEncryptRecovery} />
          <View style={{ marginTop: 8 }} />
          <Button title="Decrypt AES with Recovery" onPress={handleDecryptRecovery} />
        </View>

        {encryptedMaster && encryptedMaster.ciphertext && (
          <Text>Encrypted (Master): {encryptedMaster.ciphertext.slice(0, 16)}...</Text>
        )}

        {encryptedRecovery && encryptedRecovery.ciphertext && (
          <Text>Encrypted (Recovery): {encryptedRecovery.ciphertext.slice(0, 16)}...</Text>
        )}

        {encryptedRecovery && (
          <View style={{ marginBottom: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
            <Text>Encrypted (Recovery): {encryptedRecovery.ciphertext.slice(0, 16)}...</Text>
          </View>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default SecurityComponent;

