import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  Switch,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/AxiosWrapper";

import { SafeAreaView } from "react-native-safe-area-context";

interface UserProfile {
  ID: string;
  Email: string;
  FullName: string;
  ProfilePicture?: string;
  CreatedAt: string;
}

interface Device {
  ID: string;
  DeviceName: string;
  IPAddress: string;
  LastSyncAt: string;
  CreatedAt: string;
}

function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response: any = await api.put("/auth/change-password", data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("Success", "Password changed successfully");
      onClose();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to change password",
      );
    },
  });

  const handleChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-700 mb-1">Current Password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          <Text className="text-sm text-gray-700 mb-1">New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          <Text className="text-sm text-gray-700 mb-1">
            Confirm New Password
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          <TouchableOpacity
            onPress={handleChange}
            disabled={changePasswordMutation.isPending}
            className={`py-4 rounded-lg items-center ${changePasswordMutation.isPending ? "bg-gray-400" : "bg-blue-500"}`}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EditProfileModal({
  visible,
  onClose,
  profile,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => void;
}) {
  const [fullName, setFullName] = useState(profile?.FullName || "");

  useEffect(() => {
    if (profile) setFullName(profile.FullName);
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      const response: any = await api.put("/auth/profile", data);
      return response.data;
    },
    onSuccess: () => {
      onUpdate({ FullName: fullName });
      Alert.alert("Success", "Profile updated");
      onClose();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to update profile",
      );
    },
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    updateProfileMutation.mutate({ fullName });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-700 mb-1">Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 mb-4"
          />

          <Text className="text-sm text-gray-700 mb-1">Email</Text>
          <TextInput
            value={profile?.Email}
            editable={false}
            className="bg-gray-200 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-gray-500"
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={updateProfileMutation.isPending}
            className={`py-4 rounded-lg items-center ${updateProfileMutation.isPending ? "bg-gray-400" : "bg-blue-500"}`}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function DevicesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: devices,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response: any = await api.get("/device/list");
      return response.data || [];
    },
    enabled: visible,
  });

  const revokeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response: any = await api.delete(`/device/revoke/${deviceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      Alert.alert("Success", "Device has been revoked");
    },
    onError: () => {
      Alert.alert("Error", "Failed to revoke device");
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleRevokeDevice = (device: Device) => {
    Alert.alert(
      "Revoke Device",
      `Remove "${device.DeviceName}" from your account? This device will need to login again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => revokeDeviceMutation.mutate(device.ID),
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const renderDevice = ({ item, index }: { item: Device; index: number }) => {
    const isCurrentDevice = index === 0;

    return (
      <View
        className={`bg-gray-50 rounded-xl p-4 mb-3 ${isCurrentDevice ? "border-2 border-blue-500" : "border border-gray-200"}`}
      >
        <View className="flex-row items-start">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              isCurrentDevice ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <Icon
              name="cellphone"
              size={20}
              color={isCurrentDevice ? "white" : "#6B7280"}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">
                {item.DeviceName}
              </Text>
              {isCurrentDevice && (
                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-blue-700 text-xs font-medium">
                    Current
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center mt-1">
              <Icon name="ip-network" size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1">
                {item.IPAddress || "Unknown IP"}
              </Text>
            </View>

            <View className="flex-row items-center mt-1">
              <Icon name="login" size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1">
                Last logged in: {getTimeSince(item.LastSyncAt)}
              </Text>
            </View>
          </View>

          {!isCurrentDevice && (
            <TouchableOpacity
              onPress={() => handleRevokeDevice(item)}
              disabled={revokeDeviceMutation.isPending}
              className="p-2"
            >
              <Icon name="close-circle-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Your Devices</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <View className="flex-row items-center">
              <Icon name="information" size={20} color="#3B82F6" />
              <Text className="text-blue-600 text-xs ml-2 flex-1">
                Track and manage all devices logged into your account.
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : !devices || devices.length === 0 ? (
            <View className="items-center py-8">
              <Icon name="cellphone-off" size={48} color="#CBD5E1" />
              <Text className="text-gray-400 mt-2">No devices found</Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.ID}
              renderItem={renderDevice}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricsAvailable(hasHardware && isEnrolled);

    const enabled = await SecureStore.getItemAsync("biometricsEnabled");
    setBiometricsEnabled(enabled === "true");
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value) {
      // Authenticate before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometrics",
        fallbackLabel: "Use passcode",
      });

      if (result.success) {
        await SecureStore.setItemAsync("biometricsEnabled", "true");
        setBiometricsEnabled(true);
        Alert.alert("Success", "Biometric authentication enabled!");
      } else {
        Alert.alert("Failed", "Biometric authentication failed");
      }
    } else {
      await SecureStore.setItemAsync("biometricsEnabled", "false");
      setBiometricsEnabled(false);
      Alert.alert("Disabled", "Biometric authentication disabled");
    }
  };

  const fetchProfile = async () => {
    try {
      const response: any = await api.get("/auth/profile");
      setProfile(response.data);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      if (err?.response?.status === 401 || err?.response?.status === 498) {
        Alert.alert("Session Expired", "Please login again");
        navigation.navigate("auth" as never);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          navigation.reset({ index: 0, routes: [{ name: "auth" as never }] });
        },
      },
    ]);
  };

  const handleClearLocalKey = () => {
    Alert.alert(
      "Clear Encryption Key",
      "This will remove your local encryption key. You'll need your recovery code to access your vault again. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Key",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("aesKey");
            Alert.alert(
              "Cleared",
              "Encryption key removed. Use your recovery code to restore access.",
            );
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all vault data. This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            Alert.alert("Info", "Account deletion coming soon");
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const MenuItem = ({
    icon,
    label,
    color = "#6B7280",
    onPress,
    danger = false,
  }: {
    icon: string;
    label: string;
    color?: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center bg-white p-4 rounded-lg mb-2 ${
        danger ? "bg-red-50" : ""
      }`}
    >
      <Icon name={icon as any} size={24} color={danger ? "#EF4444" : color} />
      <Text className={`ml-4 flex-1 text-base ${danger ? "text-red-500" : ""}`}>
        {label}
      </Text>
      <Icon name="chevron-right" size={24} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-blue-500 pt-12 pb-8 px-6 items-center">
        <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4">
          <Icon name="account" size={48} color="#3B82F6" />
        </View>
        <Text className="text-white text-xl font-bold">
          {profile?.FullName || "User"}
        </Text>
        <Text className="text-blue-100 mt-1">{profile?.Email}</Text>
      </View>

      <View className="flex-row justify-around py-6 bg-white mx-4 -mt-4 rounded-xl shadow-sm">
        <View className="items-center">
          <Icon name="shield-check" size={28} color="#16a34a" />
          <Text className="text-gray-600 mt-1 text-xs">AES-256</Text>
        </View>
        <View className="items-center">
          <Icon name="lock" size={28} color="#3B82F6" />
          <Text className="text-gray-600 mt-1 text-xs">Zero-Knowledge</Text>
        </View>
        <View className="items-center">
          <Icon name="key-variant" size={28} color="#8B5CF6" />
          <Text className="text-gray-600 mt-1 text-xs">Recovery Ready</Text>
        </View>
      </View>

      <View className="mt-6 mx-4">
        <Text className="text-gray-500 text-sm font-medium mb-2 px-2">
          ACCOUNT
        </Text>
        <MenuItem
          icon="account-edit"
          label="Edit Profile"
          color="#3B82F6"
          onPress={() => setShowEditProfile(true)}
        />
        <MenuItem
          icon="key-change"
          label="Change Password"
          color="#8B5CF6"
          onPress={() => setShowChangePassword(true)}
        />
      </View>

      <View className="mt-6 mx-4">
        <Text className="text-gray-500 text-sm font-medium mb-2 px-2">
          SECURITY
        </Text>

        {biometricsAvailable && (
          <View className="flex-row items-center bg-white p-4 rounded-lg mb-2">
            <Icon name="fingerprint" size={24} color="#10B981" />
            <View className="ml-4 flex-1">
              <Text className="text-base">Biometric Unlock</Text>
              <Text className="text-gray-500 text-xs">
                Use fingerprint or face to decrypt passwords
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={toggleBiometrics}
              trackColor={{ false: "#D1D5DB", true: "#10B981" }}
              thumbColor={biometricsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        )}

        <MenuItem
          icon="cellphone-link"
          label="Manage Devices"
          color="#F59E0B"
          onPress={() => setShowDevices(true)}
        />
        <MenuItem
          icon="key-variant"
          label="View Recovery Info"
          color="#F59E0B"
          onPress={() => {
            Alert.alert(
              "Recovery Code",
              "Your recovery code was shown when you created your account. We cannot display it again for security reasons.\n\nIf you lost it, you'll need to create a new account.",
              [{ text: "OK" }],
            );
          }}
        />
        <MenuItem
          icon="delete-sweep"
          label="Clear Local Encryption Key"
          color="#F59E0B"
          onPress={handleClearLocalKey}
        />
      </View>

      {/* Danger Zone */}
      <View className="mt-6 mx-4">
        <Text className="text-gray-500 text-sm font-medium mb-2 px-2">
          DANGER ZONE
        </Text>
        <MenuItem icon="logout" label="Logout" onPress={handleLogout} danger />
        <MenuItem
          icon="delete-forever"
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      <View className="items-center py-8">
        <Text className="text-gray-400 text-sm">goPass v1.0.0</Text>
        <Text className="text-gray-300 text-xs mt-1">
          Zero-knowledge encryption
        </Text>
      </View>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onUpdate={(data) =>
          setProfile((prev) => (prev ? { ...prev, ...data } : null))
        }
      />
      <DevicesModal
        visible={showDevices}
        onClose={() => setShowDevices(false)}
      />
    </ScrollView>
  );
}
