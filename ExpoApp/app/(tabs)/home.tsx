import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Svg, { Circle } from "react-native-svg";
import api from "@/utils/AxiosWrapper";
import { decryptPassword, encryptPassword } from "@/utils/crypto";
import { authenticateWithBiometrics } from "@/utils/securityHelpers";

// Platform icon mapping
const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  Gmail: { icon: "gmail", color: "#DB4437" },
  Google: { icon: "google", color: "#4285F4" },
  GitHub: { icon: "github", color: "#333" },
  Facebook: { icon: "facebook", color: "#4267B2" },
  Netflix: { icon: "netflix", color: "#E50914" },
  Spotify: { icon: "spotify", color: "#1DB954" },
  Twitter: { icon: "twitter", color: "#1DA1F2" },
  LinkedIn: { icon: "linkedin", color: "#0077B5" },
  AWS: { icon: "aws", color: "#FF9900" },
  Twitch: { icon: "twitch", color: "#9146FF" },
  Instagram: { icon: "instagram", color: "#E4405F" },
  Apple: { icon: "apple", color: "#000000" },
  Microsoft: { icon: "microsoft", color: "#00A4EF" },
  Slack: { icon: "slack", color: "#4A154B" },
  Reddit: { icon: "reddit", color: "#FF4500" },
  Banking: { icon: "bank", color: "#059669" },
  Shopping: { icon: "cart", color: "#F59E0B" },
  Gaming: { icon: "gamepad-variant", color: "#8B5CF6" },
  Work: { icon: "briefcase", color: "#3B82F6" },
  Other: { icon: "key", color: "#6B7280" },
};

interface VaultEntry {
  ID: string;
  PlatformName: string;
  EntryKey: string;
  EncryptedPassword: number[] | string;
  IV: number[] | string;
  MetaData?: {
    identifier?: string;
    email?: string;
    category?: string;
    website?: string;
    notes?: string;
    isFavorite?: boolean;
  };
  PasswordSHA1?: string;
  IsBreached?: boolean;
  BreachCount?: number;
  LastBreachCheck?: string;
  CreatedAt: string;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

function bytesToHex(data: number[] | string | null | undefined): string {
  if (!data) return "";

  if (typeof data === "string") {
    try {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      return data;
    }
  }

  if (Array.isArray(data)) {
    return data.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return "";
}

function DonutChart({
  size = 120,
  strokeWidth = 12,
  total,
  breached,
}: {
  size?: number;
  strokeWidth?: number;
  total: number;
  breached: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeCount = total - breached;
  const safePercent = total > 0 ? (safeCount / total) * 100 : 100;
  const breachedOffset = circumference - (breached / total) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22C55E"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={
            total > 0 ? circumference - (safeCount / total) * circumference : 0
          }
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        {/* Breached (red) arc */}
        {breached > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EF4444"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={breachedOffset}
            strokeLinecap="round"
            rotation={`${(safeCount / total) * 360 - 90}`}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      {/* Center text */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color:
              safePercent >= 80
                ? "#22C55E"
                : safePercent >= 50
                  ? "#F59E0B"
                  : "#EF4444",
          }}
        >
          {Math.round(safePercent)}%
        </Text>
        <Text style={{ fontSize: 10, color: "#6B7280" }}>Safe</Text>
      </View>
    </View>
  );
}

export default function Home() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    entryKey: "",
    platformName: "",
    identifier: "",
    website: "",
    notes: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showBreachedOnly, setShowBreachedOnly] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["vaultStats"],
    queryFn: async () => {
      const response: any = await api.get("/vault/stats");
      return {
        totalPasswords: response.totalPasswords || 0,
        breachedCount: response.breachedCount || 0,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const {
    data: vaultData,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["vaultItems"],
    queryFn: async () => {
      const response: any = await api.get(`/vault/items?page=1&limit=50`);
      return {
        items: response.data || [],
        hasMore: response.hasMore || false,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const vault = vaultData?.items || [];
  const refreshing = isRefetching;

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["vaultItems"] });
    queryClient.invalidateQueries({ queryKey: ["vaultStats"] });
  };

  const openDetailModal = async (item: VaultEntry) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setShowPassword(false);
    setDecryptedPassword("");
    setIsEditing(false);
    setEditData({
      entryKey: item.EntryKey,
      platformName: item.PlatformName,
      identifier: item.MetaData?.identifier || "",
      website: item.MetaData?.website || "",
      notes: item.MetaData?.notes || "",
      password: "",
    });
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    setShowPassword(false);
    setDecryptedPassword("");
    setIsEditing(false);
  };

  const togglePasswordVisibility = async () => {
    if (!selectedItem) return;

    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword("");
      return;
    }

    // Biometric authentication before showing password
    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      Alert.alert(
        "Authentication Failed",
        "Please authenticate to view password",
      );
      return;
    }

    setIsDecrypting(true);
    try {
      const aesKey = await SecureStore.getItemAsync("aesKey");
      if (!aesKey) {
        Alert.alert("Error", "No encryption key. Please login again.");
        return;
      }

      const encrypted = {
        ciphertext: bytesToHex(selectedItem.EncryptedPassword),
        iv: bytesToHex(selectedItem.IV),
      };

      const plainPassword = decryptPassword(encrypted, aesKey);
      setDecryptedPassword(plainPassword);
      setShowPassword(true);
    } catch (err) {
      console.error("Decryption failed:", err);
      Alert.alert("Error", "Failed to decrypt password");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const aesKey = await SecureStore.getItemAsync("aesKey");
      if (!aesKey) {
        Alert.alert("Error", "No encryption key. Please login again.");
        return;
      }

      let payload: any = {
        id: selectedItem.ID,
        platformname: editData.platformName,
        entrykey: editData.entryKey,
        metadata: {
          identifier: editData.identifier || undefined,
          website: editData.website || undefined,
          notes: editData.notes || undefined,
          category: selectedItem.MetaData?.category,
          isFavorite: selectedItem.MetaData?.isFavorite,
        },
      };

      if (editData.password) {
        const encrypted = await encryptPassword(editData.password, aesKey);
        payload.encyptedpassword = hexToBytes(encrypted.ciphertext);
        payload.iv = hexToBytes(encrypted.iv);
        const sha1Hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA1,
          editData.password,
        );
        payload.passwordsha1 = sha1Hash.toUpperCase();
      }

      await api.put("/vault/update", payload);
      Alert.alert("Success", "Password updated successfully! 🔐");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["vaultItems"] });
      queryClient.invalidateQueries({ queryKey: ["vaultStats"] });
      closeDetailModal();
    } catch (err: any) {
      console.error("Update failed:", err);
      Alert.alert("Error", err?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPassword = async (item: VaultEntry) => {
    // Biometric authentication before copying password
    const authenticated = await authenticateWithBiometrics();
    if (!authenticated) {
      Alert.alert(
        "Authentication Failed",
        "Please authenticate to copy password",
      );
      return;
    }

    setDecryptingId(item.ID);
    try {
      const aesKey = await SecureStore.getItemAsync("aesKey");
      if (!aesKey) {
        Alert.alert("Error", "No encryption key. Please login again.");
        return;
      }

      const encrypted = {
        ciphertext: bytesToHex(item.EncryptedPassword),
        iv: bytesToHex(item.IV),
      };

      const plainPassword = decryptPassword(encrypted, aesKey);
      await Clipboard.setStringAsync(plainPassword);
      Alert.alert("Copied!", "Password copied to clipboard");
    } catch (err) {
      console.error("Decryption failed:", err);
      Alert.alert("Error", "Failed to decrypt password");
    } finally {
      setDecryptingId(null);
    }
  };

  const handleDelete = async (item: VaultEntry) => {
    Alert.alert("Delete Password", `Delete "${item.EntryKey}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/vault/delete/${item.ID}`);
            queryClient.invalidateQueries({ queryKey: ["vaultItems"] });
            queryClient.invalidateQueries({ queryKey: ["vaultStats"] });
            Alert.alert("Deleted", "Password removed from vault");
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const filteredVault = vault.filter((item: VaultEntry) => {
    const matchesSearch =
      item.PlatformName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.EntryKey?.toLowerCase().includes(searchText.toLowerCase());

    if (showBreachedOnly) {
      return matchesSearch && item.IsBreached;
    }
    return matchesSearch;
  });

  const getIcon = (platform: string) => {
    return PLATFORM_ICONS[platform] || { icon: "key", color: "#6B7280" };
  };

  const renderItem = ({ item }: { item: VaultEntry }) => {
    const { icon, color } = getIcon(item.PlatformName);
    const isDecryptingItem = decryptingId === item.ID;

    return (
      <TouchableOpacity
        onPress={() => openDetailModal(item)}
        className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
        activeOpacity={0.7}
      >
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: color }}
        >
          <Icon name={icon as any} size={24} color="white" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-lg text-gray-900">
              {item.PlatformName}
            </Text>
            {item.IsBreached && (
              <View className="ml-2 bg-red-100 px-2 py-0.5 rounded-full flex-row items-center">
                <Icon name="alert-circle" size={12} color="#EF4444" />
                <Text className="text-red-600 text-xs ml-1">Breached</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600">{item.EntryKey}</Text>
          {(item.MetaData?.identifier || item.MetaData?.email) && (
            <Text className="text-gray-400 text-sm">
              {item.MetaData.identifier || item.MetaData.email}
            </Text>
          )}
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleCopyPassword(item);
            }}
            disabled={isDecryptingItem}
            className="p-2"
          >
            {isDecryptingItem ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Icon name="content-copy" size={22} color="#3B82F6" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="p-2"
          >
            <Icon name="delete-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;
    const { icon, color } = getIcon(selectedItem.PlatformName);

    return (
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            <View className="bg-blue-500 px-6 pt-6 pb-8 rounded-t-3xl">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <Icon name={icon as any} size={28} color="white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white/70 text-sm">
                      {isEditing ? "Editing" : "Details for"}
                    </Text>
                    <Text className="text-white text-xl font-bold">
                      {selectedItem.PlatformName}
                    </Text>
                    <Text className="text-white/80 text-sm">
                      {selectedItem.EntryKey}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={closeDetailModal} className="p-2">
                  <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              className="px-6 -mt-4"
              showsVerticalScrollIndicator={false}
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
                {isEditing ? (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {" "}
                      Title
                    </Text>
                    <TextInput
                      value={editData.entryKey}
                      onChangeText={(text) =>
                        setEditData({ ...editData, entryKey: text })
                      }
                      placeholder="Title"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {" "}
                      Username / Email
                    </Text>
                    <TextInput
                      value={editData.identifier}
                      onChangeText={(text) =>
                        setEditData({ ...editData, identifier: text })
                      }
                      placeholder="Username or email"
                      autoCapitalize="none"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {" "}
                      New Password (optional)
                    </Text>
                    <TextInput
                      value={editData.password}
                      onChangeText={(text) =>
                        setEditData({ ...editData, password: text })
                      }
                      placeholder="Leave blank to keep current"
                      secureTextEntry
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {" "}
                      Website URL
                    </Text>
                    <TextInput
                      value={editData.website}
                      onChangeText={(text) =>
                        setEditData({ ...editData, website: text })
                      }
                      placeholder="https://example.com"
                      autoCapitalize="none"
                      keyboardType="url"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      {" "}
                      Notes
                    </Text>
                    <TextInput
                      value={editData.notes}
                      onChangeText={(text) =>
                        setEditData({ ...editData, notes: text })
                      }
                      placeholder="Additional notes"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[80px]"
                    />
                  </>
                ) : (
                  <>
                    <View className="mb-4">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        {" "}
                        Password
                      </Text>
                      <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <Text className="flex-1 font-mono text-lg text-gray-800">
                          {showPassword ? decryptedPassword : "••••••••••••"}
                        </Text>
                        <TouchableOpacity
                          onPress={togglePasswordVisibility}
                          disabled={isDecrypting}
                          className="p-2 mr-2"
                        >
                          {isDecrypting ? (
                            <ActivityIndicator size="small" color="#3B82F6" />
                          ) : (
                            <Icon
                              name={showPassword ? "eye-off" : "eye"}
                              size={22}
                              color="#3B82F6"
                            />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCopyPassword(selectedItem)}
                          className="p-2"
                        >
                          <Icon name="content-copy" size={22} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>

                      {selectedItem.IsBreached && (
                        <View className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 flex-row items-center">
                          <Icon name="alert-circle" size={20} color="#EF4444" />
                          <View className="ml-2 flex-1">
                            <Text className="text-red-700 font-medium">
                              Password Compromised!
                            </Text>
                            <Text className="text-red-600 text-xs">
                              Found in{" "}
                              {selectedItem.BreachCount?.toLocaleString()} data
                              breaches. Change it immediately.
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {selectedItem.MetaData?.identifier && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          {" "}
                          Username / Email
                        </Text>
                        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center">
                          <Text className="flex-1 text-gray-800">
                            {selectedItem.MetaData.identifier}
                          </Text>
                          <TouchableOpacity
                            onPress={async () => {
                              await Clipboard.setStringAsync(
                                selectedItem.MetaData?.identifier || "",
                              );
                              Alert.alert(
                                "Copied!",
                                "Username copied to clipboard",
                              );
                            }}
                            className="p-2"
                          >
                            <Icon
                              name="content-copy"
                              size={20}
                              color="#6B7280"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {selectedItem.MetaData?.website && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          {" "}
                          Website
                        </Text>
                        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <Text className="text-blue-600">
                            {selectedItem.MetaData.website}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedItem.MetaData?.category && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          {" "}
                          Category
                        </Text>
                        <View className="bg-blue-50 rounded-xl px-4 py-2 self-start border border-blue-200">
                          <Text className="text-blue-700">
                            {selectedItem.MetaData.category}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedItem.MetaData?.notes && (
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                          {" "}
                          Notes
                        </Text>
                        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <Text className="text-gray-700">
                            {selectedItem.MetaData.notes}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View className="mb-4">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        {" "}
                        Created
                      </Text>
                      <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <Text className="text-gray-600">
                          {new Date(selectedItem.CreatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              <View className="flex-row gap-3 mb-8">
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 py-4 rounded-xl items-center flex-row justify-center"
                    >
                      <Icon name="close" size={20} color="#6B7280" />
                      <Text className="text-gray-700 font-semibold ml-2">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      disabled={isSaving}
                      className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                        isSaving ? "bg-gray-400" : "bg-blue-500"
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Icon name="check" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">
                            Save
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="flex-1 bg-blue-500 py-4 rounded-xl items-center flex-row justify-center"
                    >
                      <Icon name="pencil" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        closeDetailModal();
                        handleDelete(selectedItem);
                      }}
                      className="flex-1 bg-red-50 py-4 rounded-xl items-center flex-row justify-center border border-red-200"
                    >
                      <Icon name="delete-outline" size={20} color="#EF4444" />
                      <Text className="text-red-500 font-semibold ml-2">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-500">Loading vault...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-4">
      <View className="flex-row justify-between items-center mt-4 mb-4">
        <Text className="text-gray-500">{vault.length} items</Text>
      </View>

      {stats && stats.totalPasswords > 0 && (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center">
            <DonutChart
              total={stats.totalPasswords}
              breached={stats.breachedCount}
              size={100}
              strokeWidth={10}
            />

            <View className="flex-1 ml-4">
              <View className="flex-row items-center mb-2">
                <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <Text className="text-gray-600 text-sm">Safe: </Text>
                <Text className="font-semibold text-gray-800">
                  {stats.totalPasswords - stats.breachedCount}
                </Text>
              </View>
              <View className="flex-row items-center mb-3">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <Text className="text-gray-600 text-sm">Breached: </Text>
                <Text className="font-semibold text-red-600">
                  {stats.breachedCount}
                </Text>
              </View>

              {stats.breachedCount > 0 && (
                <TouchableOpacity
                  onPress={() => setShowBreachedOnly(!showBreachedOnly)}
                  className={`py-2 px-3 rounded-lg flex-row items-center justify-center ${
                    showBreachedOnly ? "bg-gray-200" : "bg-red-500"
                  }`}
                >
                  <Icon
                    name={showBreachedOnly ? "close" : "alert-circle-outline"}
                    size={16}
                    color={showBreachedOnly ? "#374151" : "white"}
                  />
                  <Text
                    className={`text-xs font-medium ml-1 ${showBreachedOnly ? "text-gray-700" : "text-white"}`}
                  >
                    {showBreachedOnly ? "Show All" : "View Breached"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View className="mb-4">
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search passwords..."
          className="bg-white px-4 py-3 rounded-xl border border-gray-200"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {filteredVault.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Icon
            name={showBreachedOnly ? "shield-check" : "shield-lock-outline"}
            size={64}
            color={showBreachedOnly ? "#22C55E" : "#CBD5E1"}
          />
          <Text className="text-gray-400 mt-4 text-lg">
            {showBreachedOnly
              ? "No breached passwords! "
              : searchText
                ? "No matches found"
                : "No passwords yet"}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {showBreachedOnly
              ? "All your passwords are safe"
              : !searchText && "Add your first password from the menu"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVault}
          keyExtractor={(item) => item.ID}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}
