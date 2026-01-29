import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import api from "@/utils/AxiosWrapper";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as Clipboard from "expo-clipboard";
import { encryptPassword } from "@/utils/crypto";
import { useQueryClient } from "@tanstack/react-query";

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}
const PLATFORMS = [
  { name: "Gmail", icon: "gmail", color: "#D93025" },
  { name: "Google", icon: "google", color: "#4285F4" },
  { name: "GitHub", icon: "github", color: "#333" },
  { name: "Facebook", icon: "facebook", color: "#4267B2" },
  { name: "Instagram", icon: "instagram", color: "#E4405F" },
  { name: "Netflix", icon: "netflix", color: "#E50914" },
  { name: "Spotify", icon: "spotify", color: "#1DB954" },
  { name: "Twitter", icon: "twitter", color: "#1DA1F2" },
  { name: "LinkedIn", icon: "linkedin", color: "#0077B5" },
  { name: "Apple", icon: "apple", color: "#000000" },
  { name: "Microsoft", icon: "microsoft", color: "#00A4EF" },
  { name: "Slack", icon: "slack", color: "#4A154B" },
  { name: "Reddit", icon: "reddit", color: "#FF4500" },
  { name: "Banking", icon: "bank", color: "#059669" },
  { name: "Shopping", icon: "cart", color: "#F59E0B" },
  { name: "Gaming", icon: "gamepad-variant", color: "#8B5CF6" },
  { name: "Work", icon: "briefcase", color: "#3B82F6" },
  { name: "Other", icon: "key", color: "#6B7280" },
];

const CATEGORIES = [
  { name: "Personal", icon: "account", color: "#3B82F6" },
  { name: "Work", icon: "briefcase", color: "#8B5CF6" },
  { name: "Finance", icon: "cash", color: "#059669" },
  { name: "Social", icon: "account-group", color: "#EC4899" },
  { name: "Entertainment", icon: "movie", color: "#F59E0B" },
  { name: "Shopping", icon: "cart", color: "#EF4444" },
];

function PasswordGenerator({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (pwd: string) => void;
}) {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generated, setGenerated] = useState("");

  const generatePassword = async () => {
    let chars = "";
    if (useLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (useUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useNumbers) chars += "0123456789";
    if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!chars) {
      Alert.alert("Error", "Select at least one character type");
      return;
    }

    const randomBytes = await Crypto.getRandomBytesAsync(length);
    let pwd = "";
    for (let i = 0; i < length; i++) {
      pwd += chars[randomBytes[i] % chars.length];
    }
    setGenerated(pwd);
  };

  const Option = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      onPress={onToggle}
      className={`flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg ${
        value
          ? "bg-blue-50 border border-blue-200"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <Text className={value ? "text-blue-700" : "text-gray-600"}>{label}</Text>
      <MaterialCommunityIcons
        name={value ? "checkbox-marked" : "checkbox-blank-outline"}
        size={24}
        color={value ? "#3B82F6" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Password Generator</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">
            Length: {length} characters
          </Text>
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => setLength(Math.max(8, length - 1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <MaterialCommunityIcons name="minus" size={20} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1 mx-4 h-2 bg-gray-200 rounded-full">
              <View
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${((length - 8) / 24) * 100}%` }}
              />
            </View>
            <TouchableOpacity
              onPress={() => setLength(Math.min(32, length + 1))}
              className="bg-gray-200 p-2 rounded-lg"
            >
              <MaterialCommunityIcons name="plus" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <Option
            label="Uppercase (A-Z)"
            value={useUppercase}
            onToggle={() => setUseUppercase(!useUppercase)}
          />
          <Option
            label="Lowercase (a-z)"
            value={useLowercase}
            onToggle={() => setUseLowercase(!useLowercase)}
          />
          <Option
            label="Numbers (0-9)"
            value={useNumbers}
            onToggle={() => setUseNumbers(!useNumbers)}
          />
          <Option
            label="Symbols (!@#$%)"
            value={useSymbols}
            onToggle={() => setUseSymbols(!useSymbols)}
          />

          <TouchableOpacity
            onPress={generatePassword}
            className="bg-blue-500 py-3 rounded-lg items-center mt-4"
          >
            <Text className="text-white font-semibold">Generate Password</Text>
          </TouchableOpacity>

          {generated && (
            <View className="mt-4 p-4 bg-gray-100 rounded-lg">
              <Text className="font-mono text-center text-lg" selectable>
                {generated}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onSelect(generated);
                  onClose();
                }}
                className="bg-green-500 py-3 rounded-lg items-center mt-4"
              >
                <Text className="text-white font-semibold">
                  Use This Password
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function AddPasswordPage() {
  const navigation = useNavigation();
  const [platform, setPlatform] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");
  const [title, setTitle] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Personal");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const client = useQueryClient();

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 25;
    return Math.min(score, 100);
  };

  const strengthColor = (score: number) => {
    if (score >= 75) return "#16a34a";
    if (score >= 50) return "#eab308";
    return "#dc2626";
  };

  const strengthLabel = (score: number) => {
    if (score >= 75) return "Strong 💪";
    if (score >= 50) return "Medium ⚠️";
    return "Weak ❌";
  };

  const handleCopyPassword = async () => {
    if (password) {
      await Clipboard.setStringAsync(password);
      Alert.alert("Copied!", "Password copied to clipboard");
    }
  };

  const handleSubmit = async () => {
    const finalPlatform =
      platform === "Other" && customPlatform ? customPlatform : platform;

    if (!finalPlatform || !title || !password) {
      Alert.alert(
        "Missing Fields",
        "Please fill platform, title, and password",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const aesKey = await SecureStore.getItemAsync("aesKey");
      if (!aesKey) {
        Alert.alert("Error", "No encryption key. Please login again.");
        setIsSubmitting(false);
        return;
      }

      const encrypted = await encryptPassword(password, aesKey);

      // Compute SHA1 hash of password for breach checking
      const sha1Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        password,
      );

      const payload = {
        platformname: finalPlatform,
        entrykey: title,
        encyptedpassword: hexToBytes(encrypted.ciphertext),
        iv: hexToBytes(encrypted.iv),
        passwordsha1: sha1Hash.toUpperCase(),
        metadata: {
          identifier: identifier || undefined,
          website: website || undefined,
          notes: notes || undefined,
          category,
          isFavorite,
        },
      };

      await api.post("/vault/add", payload);
      client.invalidateQueries({ queryKey: ["vaultItems"] });
      client.invalidateQueries({ queryKey: ["vaultStats"] });
      Alert.alert("Success", "Password saved securely! ", [
        { text: "OK", onPress: () => navigation.navigate("home" as never) },
      ]);

      // Reset
      setPlatform("");
      setCustomPlatform("");
      setTitle("");
      setIdentifier("");
      setPassword("");
      setWebsite("");
      setNotes("");
      setCategory("Personal");
      setIsFavorite(false);
    } catch (err: any) {
      console.error("Error:", err);
      Alert.alert("Error", err?.message || "Failed to save password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = getStrength(password);
  const selectedPlatformData = PLATFORMS.find((p) => p.name === platform);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-blue-500 px-4 pt-4 pb-8">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
            <MaterialCommunityIcons
              name={selectedPlatformData?.icon || "key-plus"}
              size={24}
              color="white"
            />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-white/70 text-sm">
              Adding new password for
            </Text>
            <Text className="text-white text-xl font-bold">
              {platform || "Select Platform"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            className="p-2"
          >
            <MaterialCommunityIcons
              name={isFavorite ? "star" : "star-outline"}
              size={28}
              color={isFavorite ? "#FCD34D" : "white"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 -mt-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            🌐 Select Platform
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p.name}
                onPress={() => setPlatform(p.name)}
                className={`items-center px-3 py-2 mr-2 rounded-xl border-2 ${
                  platform === p.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: p.color + "20" }}
                >
                  <MaterialCommunityIcons
                    name={p.icon as any}
                    size={22}
                    color={p.color}
                  />
                </View>
                <Text
                  className={`text-xs ${platform === p.name ? "text-blue-600 font-medium" : "text-gray-600"}`}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {platform === "Other" && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Custom Platform Name
              </Text>
              <TextInput
                value={customPlatform}
                onChangeText={setCustomPlatform}
                placeholder="Enter platform name"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              />
            </View>
          )}

          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {" "}
            Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Work Account, Personal Login"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />

          <Text className="text-sm font-semibold text-gray-700 mb-2">
            {" "}
            Username / Email / Phone
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="john@example.com or @username"
            autoCapitalize="none"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-gray-700">
              {" "}
              Password *
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenerator(true)}
              className="flex-row items-center bg-blue-50 px-3 py-1 rounded-full"
            >
              <MaterialCommunityIcons
                name="auto-fix"
                size={16}
                color="#3B82F6"
              />
              <Text className="text-blue-600 text-xs ml-1 font-medium">
                Generate
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl mb-2">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              className="flex-1 px-4 py-3"
            />
            <TouchableOpacity onPress={handleCopyPassword} className="px-2">
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="px-3"
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <View
                    style={{
                      width: `${strength}%`,
                      height: "100%",
                      backgroundColor: strengthColor(strength),
                    }}
                  />
                </View>
                <Text
                  className="text-xs font-medium"
                  style={{ color: strengthColor(strength) }}
                >
                  {strengthLabel(strength)}
                </Text>
              </View>
              <View className="flex-row flex-wrap">
                {password.length >= 8 && (
                  <View className="flex-row items-center mr-3">
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text className="text-xs text-gray-500 ml-1">8+ chars</Text>
                  </View>
                )}
                {/[A-Z]/.test(password) && (
                  <View className="flex-row items-center mr-3">
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text className="text-xs text-gray-500 ml-1">
                      Uppercase
                    </Text>
                  </View>
                )}
                {/[0-9]/.test(password) && (
                  <View className="flex-row items-center mr-3">
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text className="text-xs text-gray-500 ml-1">Numbers</Text>
                  </View>
                )}
                {/[^a-zA-Z0-9]/.test(password) && (
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color="#16a34a"
                    />
                    <Text className="text-xs text-gray-500 ml-1">Symbols</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-base font-semibold text-gray-800 mb-4">
            Additional Details
          </Text>

          <Text className="text-sm font-medium text-gray-700 mb-2">
            {" "}
            Website URL
          </Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            autoCapitalize="none"
            keyboardType="url"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">
            {" "}
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                className={`flex-row items-center px-4 py-2 mr-2 rounded-full ${
                  category === cat.name ? "bg-blue-500" : "bg-gray-100"
                }`}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={16}
                  color={category === cat.name ? "white" : cat.color}
                />
                <Text
                  className={`ml-2 text-sm ${
                    category === cat.name
                      ? "text-white font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-medium text-gray-700 mb-2"> Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes here..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[80px]"
          />
        </View>

        <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#16a34a"
            />
            <View className="ml-3 flex-1">
              <Text className="text-green-800 font-medium">
                End-to-End Encrypted
              </Text>
              <Text className="text-green-600 text-xs">
                Your password is encrypted on your device before being stored.
                We never see your actual password.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-xl items-center mb-8 flex-row justify-center ${
            isSubmitting ? "bg-gray-400" : "bg-blue-500"
          }`}
        >
          <MaterialCommunityIcons
            name={isSubmitting ? "loading" : "lock-plus"}
            size={22}
            color="white"
          />
          <Text className="text-white font-semibold text-base ml-2">
            {isSubmitting ? "Encrypting & Saving..." : "Save Password Securely"}
          </Text>
        </TouchableOpacity>
      </View>

      <PasswordGenerator
        visible={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSelect={(pwd) => setPassword(pwd)}
      />
    </ScrollView>
  );
}
