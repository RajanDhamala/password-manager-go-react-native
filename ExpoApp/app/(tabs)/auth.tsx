import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Toast } from "toastify-react-native";
import {
  generateRandomAESKey,
  generateSalt,
  generateRecoveryKey,
  encryptAESKeyWithMasterPassword,
  encryptAESKeyWithRecoveryKey,
  deriveMasterPasswordHash,
  decryptAESKeyWithRecoveryKey,
} from "../../utils/crypto";

const API_URL = "http://192.168.18.26:8080";

// Recovery Code Display Modal
function RecoveryCodeModal({
  visible,
  recoveryCode,
  onConfirm,
}: {
  visible: boolean;
  recoveryCode: string;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    Toast.success("Recovery code copied!");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
              <Icon name="key-variant" size={32} color="#F59E0B" />
            </View>
            <Text className="text-xl font-bold text-center">
              Save Your Recovery Code
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              This code is the ONLY way to recover your vault if you forget your
              password. Store it somewhere safe!
            </Text>
          </View>

          <View className="bg-gray-100 p-4 rounded-lg mb-4">
            <Text className="font-mono text-center text-sm" selectable>
              {recoveryCode}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCopy}
            className={`flex-row items-center justify-center py-3 rounded-lg mb-4 ${
              copied ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            <Icon
              name={copied ? "check" : "content-copy"}
              size={20}
              color={copied ? "#16a34a" : "#3B82F6"}
            />
            <Text
              className={`ml-2 font-medium ${copied ? "text-green-700" : "text-blue-700"}`}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Text>
          </TouchableOpacity>

          <View className="bg-red-50 p-3 rounded-lg mb-4">
            <Text className="text-red-700 text-sm text-center">
              ⚠️ We cannot recover this code. If you lose it, you lose access to
              your vault.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={!copied}
            className={`py-4 rounded-lg items-center ${
              copied ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${copied ? "text-white" : "text-gray-500"}`}
            >
              I've Saved My Recovery Code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function RecoveryInputModal({
  visible,
  onClose,
  onRecover,
}: {
  visible: boolean;
  onClose: () => void;
  onRecover: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Enter Recovery Code</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 mb-4">
            Enter your recovery code to restore access to your vault.
          </Text>

          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="XXXX-XXXX-XXXX-XXXX-..."
            autoCapitalize="none"
            className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4 font-mono"
            multiline
          />

          <TouchableOpacity
            onPress={() => onRecover(code)}
            disabled={!code.trim()}
            className={`py-4 rounded-lg items-center ${
              code.trim() ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${code.trim() ? "text-white" : "text-gray-500"}`}
            >
              Recover Vault
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ForgotPasswordModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");

  const handleResetPassword = async () => {
    if (!email) {
      Toast.error("Please enter your email");
      return;
    }
    if (!newPassword || !confirmPassword) {
      Toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      Toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      Alert.alert(
        "Password Reset",
        "Your password has been reset. You'll need to use your recovery code to restore your vault access.",
        [{ text: "OK", onPress: onSuccess }],
      );
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("email");
    } catch (err: any) {
      Toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("email");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Reset Password</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {step === "email" ? (
            <>
              <Text className="text-gray-500 mb-4">
                Enter your email to reset your password. You'll need your
                recovery code to restore vault access.
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
              />

              <TouchableOpacity
                onPress={() => {
                  if (!email) {
                    Toast.error("Please enter your email");
                    return;
                  }
                  setStep("password");
                }}
                className="py-4 rounded-lg items-center bg-blue-500"
              >
                <Text className="text-white font-semibold">Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <View className="flex-row items-center">
                  <Icon name="alert" size={20} color="#F59E0B" />
                  <Text className="text-yellow-700 text-sm ml-2 flex-1">
                    You'll need your recovery code to restore vault access after
                    resetting.
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-700 mb-1">New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="••••••••"
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
              />

              <Text className="text-sm text-gray-700 mb-1">
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setStep("email")}
                  className="flex-1 py-4 rounded-lg items-center bg-gray-200"
                >
                  <Text className="text-gray-700 font-semibold">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  className={`flex-1 py-4 rounded-lg items-center ${loading ? "bg-gray-400" : "bg-blue-500"}`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function AuthScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState("");
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  // Register device after login
  const registerDevice = async (accessToken: string) => {
    try {
      const deviceName =
        Device.modelName ||
        Device.deviceName ||
        `${Device.brand} ${Device.osName}` ||
        "Unknown Device";
      const devicePublicKey = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch(`${API_URL}/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          devicename: deviceName,
          devicepublickey: devicePublicKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.ID) {
        await SecureStore.setItemAsync("deviceId", data.data.ID);
      }
    } catch (err) {
      console.error("Failed to register device:", err);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const aesKey = await generateRandomAESKey();
      const masterSalt = await generateSalt();
      const recoverySalt = await generateSalt();
      const recoveryKey = await generateRecoveryKey();

      // Encrypt the AES key with master password
      const aesEncryptedWithMaster = await encryptAESKeyWithMasterPassword(
        aesKey,
        password,
        masterSalt,
      );

      // Encrypt the AES key with recovery key
      const aesEncryptedWithRecovery = await encryptAESKeyWithRecoveryKey(
        aesKey,
        recoveryKey,
        recoverySalt,
      );

      // Hash master password for auth
      const masterPasswordHash = deriveMasterPasswordHash(password, masterSalt);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          email,
          password,
          masterPasswordHash,
          masterSalt,
          recoverySalt,
          aesHashKeyMaster: aesEncryptedWithMaster,
          aesHashKeyRecovery: aesEncryptedWithRecovery,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Registration failed");

      return { recoveryKey, aesKey };
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("aesKey", data.aesKey);

      setGeneratedRecoveryCode(data.recoveryKey);
      setShowRecoveryCode(true);
    },
    onError: (err: any) => {
      Toast.error(err.message || "Registration failed");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Login failed");
      return data;
    },
    onSuccess: async (data) => {
      if (data.accessToken) {
        await SecureStore.setItemAsync("accessToken", data.accessToken);
      }
      if (data.refreshToken) {
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      }

      if (data.accessToken) {
        await registerDevice(data.accessToken);
      }

      // Check if we have AES key locally
      const existingKey = await SecureStore.getItemAsync("aesKey");
      if (existingKey) {
        Toast.success("Logged in!");
        navigation.navigate("home" as never);
      } else {
        setPendingLoginData(data);
        Alert.alert(
          "Encryption Key Missing",
          "Your local encryption key was cleared. Enter your recovery code to restore access.",
          [
            {
              text: "Enter Recovery Code",
              onPress: () => setShowRecoveryInput(true),
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
      }
    },
    onError: (err: any) => {
      Toast.error(err.message || "Login failed");
    },
  });

  const handleRecoveryCodeConfirm = () => {
    setShowRecoveryCode(false);
    setGeneratedRecoveryCode("");
    Toast.success("Account created! Please login.");
    setIsLogin(true);
    setFullname("");
    setPassword("");
  };

  const handleRecover = async (code: string) => {
    try {
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${await SecureStore.getItemAsync("accessToken")}`,
        },
      });
      const profile = await profileRes.json();

      if (!profile.data?.AesHashKeyRecovery || !profile.data?.RecoverySalt) {
        throw new Error("Recovery data not found");
      }

      const aesKey = decryptAESKeyWithRecoveryKey(
        profile.data.AesHashKeyRecovery,
        code.trim(),
        profile.data.RecoverySalt,
      );

      if (!aesKey) {
        throw new Error("Invalid recovery code");
      }

      // Store recovered AES key
      await SecureStore.setItemAsync("aesKey", aesKey);
      setShowRecoveryInput(false);
      Toast.success("Vault recovered!");
      navigation.navigate("home" as never);
    } catch (err: any) {
      Alert.alert("Recovery Failed", err.message || "Invalid recovery code");
    }
  };

  const handleSubmit = () => {
    if (!email || !password || (!isLogin && !fullname)) {
      Toast.error("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      Toast.error("Password must be at least 6 characters");
      return;
    }
    if (isLogin) {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const loading = loginMutation.isPending || registerMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-4">
            <Icon name="shield-lock" size={44} color="white" />
          </View>
          <Text className="text-3xl font-bold">
            {isLogin ? "Welcome Back" : "Create Account"}
          </Text>
          <Text className="text-gray-500 mt-1">
            {isLogin
              ? "Sign in to your vault"
              : "Start securing your passwords"}
          </Text>
        </View>

        <View className="space-y-4">
          {!isLogin && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Full Name
              </Text>
              <TextInput
                value={fullname}
                onChangeText={setFullname}
                placeholder="John Doe"
                autoCapitalize="words"
                className="bg-white border border-gray-200 rounded-lg px-4 py-3"
              />
            </View>
          )}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white border border-gray-200 rounded-lg px-4 py-3"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Password
            </Text>
            <View className="flex-row items-center bg-white border border-gray-200 rounded-lg">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                className="flex-1 px-4 py-3"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`py-4 rounded-lg items-center ${loading ? "bg-gray-400" : "bg-blue-500"}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-6 items-center">
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text className="text-blue-500 font-medium">
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <>
              <TouchableOpacity
                onPress={() => setShowForgotPassword(true)}
                className="mt-4"
              >
                <Text className="text-blue-500">Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowRecoveryInput(true)}
                className="mt-3"
              >
                <Text className="text-gray-500">
                  Lost access? Use recovery code
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <RecoveryCodeModal
        visible={showRecoveryCode}
        recoveryCode={generatedRecoveryCode}
        onConfirm={handleRecoveryCodeConfirm}
      />

      <RecoveryInputModal
        visible={showRecoveryInput}
        onClose={() => setShowRecoveryInput(false)}
        onRecover={handleRecover}
      />

      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          setShowForgotPassword(false);
          setShowRecoveryInput(true);
        }}
      />
    </KeyboardAvoidingView>
  );
}
