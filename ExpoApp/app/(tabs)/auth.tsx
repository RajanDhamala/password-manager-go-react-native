import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  Pressable,
  Keyboard,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useToast } from "../../components/Toast";
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
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: "cancel" | "default" | "destructive";
  }>;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center p-4"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-white rounded-2xl p-6 w-full max-w-sm"
        >
          <Text className="text-xl font-bold text-center mb-2">{title}</Text>
          <Text className="text-gray-600 text-center mb-6">{message}</Text>
          <View className="flex-row justify-center gap-3">
            {buttons?.map((btn, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onClose();
                  btn.onPress?.();
                }}
                className={`flex-1 py-3 rounded-lg items-center ${
                  btn.style === "cancel" ? "bg-gray-200" : "bg-blue-500"
                }`}
              >
                <Text
                  className={
                    btn.style === "cancel"
                      ? "text-gray-700 font-semibold"
                      : "text-white font-semibold"
                  }
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            )) || (
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3 rounded-lg items-center bg-blue-500"
              >
                <Text className="text-white font-semibold">OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function OTPModal({
  visible,
  email,
  onVerify,
  onResend,
  onClose,
  loading,
  purpose,
}: {
  visible: boolean;
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onClose: () => void;
  loading: boolean;
  purpose: "login" | "register";
}) {
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setOtp("");
      setResendTimer(60);
      setCanResend(false);
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  useEffect(() => {
    if (modalVisible && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [modalVisible, resendTimer]);

  const handleResend = () => {
    setResendTimer(60);
    setCanResend(false);
    onResend();
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropAnim,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={loading ? undefined : handleClose}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              className="bg-white rounded-t-3xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              <View className="bg-blue-500 px-6 pt-4 pb-6">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                    >
                      <Icon name="email-check" size={24} color="white" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                        Verification
                      </Text>
                      <Text className="text-white text-xl font-bold">
                        Verify Email
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={loading}
                    className="p-2 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <Icon name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                className="px-5"
                style={{ marginTop: -12 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View className="items-center mb-5">
                    <Text className="text-gray-500 text-center">
                      We've sent a 6-digit verification code to
                    </Text>
                    <Text className="text-gray-800 font-bold mt-1">
                      {email}
                    </Text>
                  </View>

                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Enter OTP Code
                  </Text>
                  <TextInput
                    value={otp}
                    onChangeText={(text) =>
                      setOtp(text.replace(/[^0-9]/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4 text-center text-2xl font-bold tracking-widest"
                  />

                  <View className="items-center mb-4">
                    {canResend ? (
                      <TouchableOpacity onPress={handleResend}>
                        <Text className="text-blue-500 font-medium">
                          Resend Code
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="text-gray-500">
                        Resend code in{" "}
                        <Text className="font-bold text-blue-500">
                          {resendTimer}s
                        </Text>
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onVerify(otp)}
                  disabled={loading || otp.length !== 6}
                  activeOpacity={0.8}
                  className={`py-4 rounded-2xl items-center flex-row justify-center mb-8 ${
                    loading || otp.length !== 6 ? "bg-gray-300" : "bg-blue-500"
                  }`}
                  style={
                    otp.length === 6 && !loading
                      ? {
                          shadowColor: "#3B82F6",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        }
                      : {}
                  }
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Icon
                        name="check"
                        size={20}
                        color={otp.length !== 6 ? "#9CA3AF" : "white"}
                      />
                      <Text
                        className={`font-bold ml-2 ${otp.length !== 6 ? "text-gray-500" : "text-white"}`}
                      >
                        Verify{" "}
                        {purpose === "login" ? "& Login" : "& Create Account"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function RecoveryCodeModal({
  visible,
  recoveryCode,
  onConfirm,
  toast,
}: {
  visible: boolean;
  recoveryCode: string;
  onConfirm: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [copied, setCopied] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setCopied(false);
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onConfirm();
    });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    toast.success("Recovery code copied!");
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropAnim,
        }}
      />

      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          <View className="bg-yellow-500 px-6 pt-4 pb-6">
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              >
                <Icon name="key-variant" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                  Important
                </Text>
                <Text className="text-white text-xl font-bold">
                  Save Recovery Code
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            className="px-5"
            style={{ marginTop: -12 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View
              className="bg-white rounded-2xl p-5 mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-gray-600 text-center mb-4">
                This code is the{" "}
                <Text className="font-bold text-gray-800">ONLY way</Text> to
                recover your vault if you forget your password. Store it
                somewhere safe!
              </Text>

              <View className="bg-gray-100 p-4 rounded-xl mb-4">
                <Text className="font-mono text-center text-sm" selectable>
                  {recoveryCode}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.7}
                className={`flex-row items-center justify-center py-3.5 rounded-xl mb-4 ${
                  copied ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <Icon
                  name={copied ? "check" : "content-copy"}
                  size={20}
                  color={copied ? "#16a34a" : "#3B82F6"}
                />
                <Text
                  className={`ml-2 font-bold ${copied ? "text-green-700" : "text-blue-700"}`}
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </Text>
              </TouchableOpacity>

              <View className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <View className="flex-row items-center">
                  <Icon name="alert-circle" size={20} color="#EF4444" />
                  <Text className="text-red-700 text-sm ml-2 flex-1 font-medium">
                    We cannot recover this code. If you lose it, you lose access
                    to your vault.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!copied}
              activeOpacity={0.8}
              className={`py-4 rounded-2xl items-center flex-row justify-center mb-8 ${
                copied ? "bg-blue-500" : "bg-gray-300"
              }`}
              style={
                copied
                  ? {
                      shadowColor: "#3B82F6",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }
                  : {}
              }
            >
              <Icon
                name="check"
                size={20}
                color={copied ? "white" : "#9CA3AF"}
              />
              <Text
                className={`font-bold ml-2 ${copied ? "text-white" : "text-gray-500"}`}
              >
                I've Saved My Recovery Code
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
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
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setCode("");
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: backdropAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              className="bg-white rounded-t-3xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* Drag handle */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="bg-blue-500 px-6 pt-4 pb-6">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                    >
                      <Icon name="key-chain" size={24} color="white" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                        Recovery
                      </Text>
                      <Text className="text-white text-xl font-bold">
                        Enter Recovery Code
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    className="p-2 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <Icon name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                className="px-5"
                style={{ marginTop: -12 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-gray-600 mb-4">
                    Enter your recovery code to restore access to your vault.
                  </Text>

                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Recovery Code
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="XXXX-XXXX-XXXX-XXXX-..."
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 font-mono text-base"
                    multiline
                  />
                </View>

                <View className="flex-row gap-3 mb-8">
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    className="flex-1 bg-gray-100 py-4 rounded-2xl items-center flex-row justify-center"
                  >
                    <Icon name="close" size={20} color="#6B7280" />
                    <Text className="text-gray-700 font-bold ml-2">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onRecover(code)}
                    disabled={!code.trim()}
                    activeOpacity={0.8}
                    className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center ${
                      code.trim() ? "bg-blue-500" : "bg-gray-300"
                    }`}
                    style={
                      code.trim()
                        ? {
                            shadowColor: "#3B82F6",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          }
                        : {}
                    }
                  >
                    <Icon
                      name="shield-check"
                      size={20}
                      color={code.trim() ? "white" : "#9CA3AF"}
                    />
                    <Text
                      className={`font-bold ml-2 ${code.trim() ? "text-white" : "text-gray-500"}`}
                    >
                      Recover
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ForgotPasswordModal({
  visible,
  onClose,
  onSuccess,
  toast,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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

      setShowSuccessAlert(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessAlert(false);
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("email");
    setModalVisible(false);
    onSuccess();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("email");
      setModalVisible(false);
      onClose();
    });
  };

  if (!modalVisible) return null;

  return (
    <>
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={{ flex: 1 }}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: backdropAnim,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={handleClose} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={0}
          >
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View
                className="bg-white rounded-t-3xl overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 20,
                }}
              >
                {/* Drag handle */}
                <View className="items-center pt-3 pb-1">
                  <View className="w-10 h-1 bg-gray-300 rounded-full" />
                </View>

                {/* Header */}
                <View className="bg-blue-500 px-6 pt-4 pb-6">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                      >
                        <Icon name="lock-reset" size={24} color="white" />
                      </View>
                      <View className="ml-3">
                        <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                          Account
                        </Text>
                        <Text className="text-white text-xl font-bold">
                          Reset Password
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={handleClose}
                      className="p-2 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Icon name="close" size={22} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="px-5"
                  style={{ marginTop: -12 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View
                    className="bg-white rounded-2xl p-5 mb-4"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {step === "email" ? (
                      <>
                        <Text className="text-gray-600 mb-4">
                          Enter your email to reset your password. You'll need
                          your recovery code to restore vault access.
                        </Text>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Email Address
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100 mb-4">
                          <View className="p-3">
                            <Icon
                              name="email-outline"
                              size={20}
                              color="#6B7280"
                            />
                          </View>
                          <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="flex-1 py-3.5 pr-4 text-base"
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex-row items-center">
                          <Icon name="alert" size={20} color="#F59E0B" />
                          <Text className="text-yellow-700 text-sm ml-3 flex-1">
                            You'll need your recovery code to restore vault
                            access after resetting.
                          </Text>
                        </View>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          New Password
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100 mb-4">
                          <View className="p-3">
                            <Icon
                              name="lock-outline"
                              size={20}
                              color="#6B7280"
                            />
                          </View>
                          <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 py-3.5 pr-4 text-base"
                          />
                        </View>

                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Confirm Password
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100">
                          <View className="p-3">
                            <Icon
                              name="lock-check-outline"
                              size={20}
                              color="#6B7280"
                            />
                          </View>
                          <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 py-3.5 pr-4 text-base"
                          />
                        </View>
                      </>
                    )}
                  </View>

                  {step === "email" ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (!email) {
                          toast.error("Please enter your email");
                          return;
                        }
                        setStep("password");
                      }}
                      activeOpacity={0.8}
                      className="py-4 rounded-2xl items-center flex-row justify-center mb-8 bg-blue-500"
                      style={{
                        shadowColor: "#3B82F6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Icon name="arrow-right" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">
                        Continue
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row gap-3 mb-8">
                      <TouchableOpacity
                        onPress={() => setStep("email")}
                        activeOpacity={0.7}
                        className="flex-1 bg-gray-100 py-4 rounded-2xl items-center flex-row justify-center"
                      >
                        <Icon name="arrow-left" size={20} color="#6B7280" />
                        <Text className="text-gray-700 font-bold ml-2">
                          Back
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleResetPassword}
                        disabled={loading}
                        activeOpacity={0.8}
                        className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center ${loading ? "bg-gray-400" : "bg-blue-500"}`}
                        style={
                          !loading
                            ? {
                                shadowColor: "#3B82F6",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                              }
                            : {}
                        }
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Icon name="check" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">
                              Reset
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <CustomAlert
        visible={showSuccessAlert}
        title="Password Reset"
        message="Your password has been reset. You'll need to use your recovery code to restore your vault access."
        buttons={[{ text: "OK", onPress: handleSuccessConfirm }]}
        onClose={handleSuccessConfirm}
      />
    </>
  );
}

export default function AuthScreen() {
  const navigation = useNavigation();
  const toast = useToast();
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

  // OTP verification states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"login" | "register">("login");
  const [pendingRegData, setPendingRegData] = useState<{
    aesKey: string;
    recoveryKey: string;
    masterSalt: string;
    recoverySalt: string;
    aesEncryptedWithMaster: any;
    aesEncryptedWithRecovery: any;
    masterPasswordHash: string;
  } | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showEncryptionKeyAlert, setShowEncryptionKeyAlert] = useState(false);

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

  // Step 1: Send OTP for registration
  const sendRegisterOTPMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/auth/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      return data;
    },
    onSuccess: async () => {
      // Pre-generate crypto data while user enters OTP
      const aesKey = await generateRandomAESKey();
      const masterSalt = await generateSalt();
      const recoverySalt = await generateSalt();
      const recoveryKey = await generateRecoveryKey();

      const aesEncryptedWithMaster = await encryptAESKeyWithMasterPassword(
        aesKey,
        password,
        masterSalt,
      );
      const aesEncryptedWithRecovery = await encryptAESKeyWithRecoveryKey(
        aesKey,
        recoveryKey,
        recoverySalt,
      );
      const masterPasswordHash = deriveMasterPasswordHash(password, masterSalt);

      setPendingRegData({
        aesKey,
        recoveryKey,
        masterSalt,
        recoverySalt,
        aesEncryptedWithMaster,
        aesEncryptedWithRecovery,
        masterPasswordHash,
      });

      setOtpPurpose("register");
      setShowOTPModal(true);
      toast.success("OTP sent to your email!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send OTP");
    },
  });

  // Step 2: Verify OTP and complete registration
  const verifyRegisterOTP = async (otp: string) => {
    if (!pendingRegData) return;

    setOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          email,
          password,
          otp,
          masterPasswordHash: pendingRegData.masterPasswordHash,
          masterSalt: pendingRegData.masterSalt,
          recoverySalt: pendingRegData.recoverySalt,
          aesHashKeyMaster: pendingRegData.aesEncryptedWithMaster,
          aesHashKeyRecovery: pendingRegData.aesEncryptedWithRecovery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      await SecureStore.setItemAsync("aesKey", pendingRegData.aesKey);

      // Store tokens from auto-login
      if (data.accessToken) {
        await SecureStore.setItemAsync("accessToken", data.accessToken);
      }
      if (data.refreshToken) {
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      }

      // Register device after auto-login
      if (data.accessToken) {
        await registerDevice(data.accessToken);
      }

      setGeneratedRecoveryCode(pendingRegData.recoveryKey);
      setShowOTPModal(false);
      setShowRecoveryCode(true);
      setPendingRegData(null);
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 1: Send OTP for login
  const sendLoginOTPMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/auth/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      return data;
    },
    onSuccess: () => {
      setOtpPurpose("login");
      setShowOTPModal(true);
      toast.success("OTP sent to your email!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Login failed");
    },
  });

  // Step 2: Verify OTP and complete login
  const verifyLoginOTP = async (otp: string) => {
    setOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

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
        setShowOTPModal(false);
        toast.success("Logged in!");
        navigation.navigate("home" as never);
      } else {
        setPendingLoginData(data);
        setShowOTPModal(false);
        setShowEncryptionKeyAlert(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Legacy mutations kept for compatibility but now use OTP flow
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
      toast.error(err.message || "Registration failed");
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
        toast.success("Logged in!");
        navigation.navigate("home" as never);
      } else {
        setPendingLoginData(data);
        setShowEncryptionKeyAlert(true);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Login failed");
    },
  });

  const [showRecoveryFailedAlert, setShowRecoveryFailedAlert] = useState(false);
  const [recoveryFailedMessage, setRecoveryFailedMessage] = useState("");

  const handleRecoveryCodeConfirm = () => {
    setShowRecoveryCode(false);
    setGeneratedRecoveryCode("");
    setFullname("");
    setPassword("");
    setEmail("");
    toast.success("Account created! Logging you in...");
    // Navigate to home since user is already logged in after registration
    navigation.navigate("home" as never);
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
      toast.success("Vault recovered!");
      navigation.navigate("home" as never);
    } catch (err: any) {
      setRecoveryFailedMessage(err.message || "Invalid recovery code");
      setShowRecoveryFailedAlert(true);
    }
  };

  const handleSubmit = () => {
    if (!email || !password || (!isLogin && !fullname)) {
      toast.error("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (isLogin) {
      sendLoginOTPMutation.mutate();
    } else {
      sendRegisterOTPMutation.mutate();
    }
  };

  const handleResendOTP = () => {
    if (otpPurpose === "login") {
      sendLoginOTPMutation.mutate();
    } else {
      sendRegisterOTPMutation.mutate();
    }
  };

  const handleVerifyOTP = (otp: string) => {
    if (otpPurpose === "login") {
      verifyLoginOTP(otp);
    } else {
      verifyRegisterOTP(otp);
    }
  };

  const loading =
    sendLoginOTPMutation.isPending || sendRegisterOTPMutation.isPending;

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
        toast={toast}
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
        toast={toast}
      />

      <OTPModal
        visible={showOTPModal}
        email={email}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onClose={() => setShowOTPModal(false)}
        loading={otpLoading}
        purpose={otpPurpose}
      />

      <CustomAlert
        visible={showEncryptionKeyAlert}
        title="Encryption Key Missing"
        message="Your local encryption key was cleared. Enter your recovery code to restore access."
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter Recovery Code",
            onPress: () => setShowRecoveryInput(true),
          },
        ]}
        onClose={() => setShowEncryptionKeyAlert(false)}
      />

      <CustomAlert
        visible={showRecoveryFailedAlert}
        title="Recovery Failed"
        message={recoveryFailedMessage}
        onClose={() => setShowRecoveryFailedAlert(false)}
      />
    </KeyboardAvoidingView>
  );
}
