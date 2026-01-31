import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/AxiosWrapper";

import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
      handleClose();
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

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              className="bg-white rounded-t-3xl overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20 }}
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
                    <Icon name="key-change" size={24} color="white" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                      Security
                    </Text>
                    <Text className="text-white text-xl font-bold">
                      Change Password
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
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}
              >
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Current Password
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100 mb-4">
                  <View className="p-3">
                    <Icon name="lock-outline" size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3.5 pr-4 text-base"
                  />
                </View>

                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  New Password
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100 mb-4">
                  <View className="p-3">
                    <Icon name="lock-plus-outline" size={20} color="#6B7280" />
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
                  Confirm New Password
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100">
                  <View className="p-3">
                    <Icon name="lock-check-outline" size={20} color="#6B7280" />
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
              </View>

              <View className="flex-row gap-3 mb-8 pb-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gray-100 py-4 rounded-2xl items-center flex-row justify-center"
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-bold ml-2">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChange}
                  disabled={changePasswordMutation.isPending}
                  className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center ${
                    changePasswordMutation.isPending ? "bg-gray-400" : "bg-blue-500"
                  }`}
                  activeOpacity={0.7}
                  style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  {changePasswordMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Icon name="check" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">Update</Text>
                    </>
                  )}
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
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile) setFullName(profile.FullName);
  }, [profile]);

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      const response: any = await api.put("/auth/profile", data);
      return response.data;
    },
    onSuccess: () => {
      onUpdate({ FullName: fullName });
      Alert.alert("Success", "Profile updated");
      handleClose();
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

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdropAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          keyboardVerticalOffset={0}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
            className="bg-white rounded-t-3xl overflow-hidden"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20 }}
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
                    <Icon name="account-edit" size={24} color="white" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                      Account
                    </Text>
                    <Text className="text-white text-xl font-bold">
                      Edit Profile
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
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 }}
              >
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Full Name
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-100 mb-4">
                  <View className="p-3">
                    <Icon name="account-outline" size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="John Doe"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 py-3.5 pr-4 text-base"
                  />
                </View>

                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email
                </Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl border border-gray-200">
                  <View className="p-3">
                    <Icon name="email-outline" size={20} color="#9CA3AF" />
                  </View>
                  <Text className="flex-1 py-3.5 pr-4 text-base text-gray-400">
                    {profile?.Email}
                  </Text>
                  <View className="pr-3">
                    <Icon name="lock" size={16} color="#9CA3AF" />
                  </View>
                </View>
                <Text className="text-xs text-gray-400 mt-1 ml-1">
                  Email cannot be changed
                </Text>
              </View>

              <View className="flex-row gap-3 mb-8 pb-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gray-100 py-4 rounded-2xl items-center flex-row justify-center"
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={20} color="#6B7280" />
                  <Text className="text-gray-700 font-bold ml-2">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className={`flex-1 py-4 rounded-2xl items-center flex-row justify-center ${
                    updateProfileMutation.isPending ? "bg-gray-400" : "bg-blue-500"
                  }`}
                  activeOpacity={0.7}
                  style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  {updateProfileMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Icon name="check" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">Save</Text>
                    </>
                  )}
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

function DevicesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
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

  const handleClose = () => {
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
    enabled: modalVisible,
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
        style={isCurrentDevice ? { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : {}}
      >
        <View className="flex-row items-start">
          <View
            className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${
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
              <Text className="font-bold text-gray-900">
                {item.DeviceName}
              </Text>
              {isCurrentDevice && (
                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-blue-700 text-xs font-bold">
                    This Device
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center mt-1.5">
              <Icon name="ip-network" size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1.5">
                {item.IPAddress || "Unknown IP"}
              </Text>
            </View>

            <View className="flex-row items-center mt-1">
              <Icon name="clock-outline" size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1.5">
                Last active: {getTimeSince(item.LastSyncAt)}
              </Text>
            </View>
          </View>

          {!isCurrentDevice && (
            <TouchableOpacity
              onPress={() => handleRevokeDevice(item)}
              disabled={revokeDeviceMutation.isPending}
              className="p-2 bg-red-50 rounded-lg"
            >
              <Icon name="close-circle-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: SCREEN_HEIGHT * 0.85,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20 }}
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
                  <Icon name="cellphone-link" size={24} color="white" />
                </View>
                <View className="ml-3">
                  <Text className="text-white/80 text-xs uppercase tracking-wider font-medium">
                    Security
                  </Text>
                  <Text className="text-white text-xl font-bold">
                    Your Devices
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

          <View className="px-5" style={{ marginTop: -12 }}>
            <View
              className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex-row items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            >
              <View className="bg-blue-100 p-2 rounded-full">
                <Icon name="information" size={18} color="#3B82F6" />
              </View>
              <Text className="text-blue-700 text-xs ml-3 flex-1 leading-4">
                Track and manage all devices logged into your account. Revoke access for any suspicious devices.
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 mt-3">Loading devices...</Text>
            </View>
          ) : !devices || devices.length === 0 ? (
            <View className="items-center py-12">
              <View className="bg-gray-100 p-4 rounded-full mb-3">
                <Icon name="cellphone-off" size={40} color="#CBD5E1" />
              </View>
              <Text className="text-gray-400 text-base">No devices found</Text>
              <Text className="text-gray-300 text-sm mt-1">Your devices will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.ID}
              renderItem={renderDevice}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
              }
            />
          )}
        </View>
      </Animated.View>
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
          <Icon name="key-variant" size={28} color="#3B82F6" />
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
          color="#3B82F6"
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
          color="#3B82F6"
          onPress={() => setShowDevices(true)}
        />
        <MenuItem
          icon="key-variant"
          label="View Recovery Info"
          color="#3B82F6"
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
          color="#3B82F6"
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
