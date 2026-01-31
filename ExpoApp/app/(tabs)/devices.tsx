import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/AxiosWrapper";

interface Device {
  ID: string;
  DeviceName: string;
  IPAddress: string;
  LastSyncAt: string;
  CreatedAt: string;
}

export default function DevicesScreen() {
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
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

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
          onPress: async () => {
            try {
              await api.delete(`/device/revoke/${device.ID}`);
              queryClient.invalidateQueries({ queryKey: ["devices"] });
              Alert.alert("Success", "Device has been revoked");
            } catch (err) {
              Alert.alert("Error", "Failed to revoke device");
            }
          },
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
        className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${isCurrentDevice ? "border-2 border-blue-500" : ""}`}
      >
        <View className="flex-row items-start">
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
              isCurrentDevice ? "bg-blue-500" : "bg-gray-200"
            }`}
          >
            <Icon
              name="cellphone"
              size={24}
              color={isCurrentDevice ? "white" : "#6B7280"}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-lg text-gray-900">
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
              <Icon name="ip-network" size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1">
                {item.IPAddress || "Unknown IP"}
              </Text>
            </View>

            <View className="flex-row items-center mt-1">
              <Icon name="clock-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1">
                Last active: {getTimeSince(item.LastSyncAt)}
              </Text>
            </View>

            <View className="flex-row items-center mt-1">
              <Icon name="calendar-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1">
                Added: {formatDate(item.CreatedAt)}
              </Text>
            </View>
          </View>

          {!isCurrentDevice && (
            <TouchableOpacity
              onPress={() => handleRevokeDevice(item)}
              className="p-2"
            >
              <Icon name="close-circle-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-500">Loading devices...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-4">
      <View className="flex-row justify-between items-center mt-4 mb-4">
        <Text className="text-2xl font-bold text-gray-900">Your Devices</Text>
        <Text className="text-gray-500">{devices?.length || 0} devices</Text>
      </View>

      <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <View className="flex-row items-center">
          <Icon name="information" size={24} color="#3B82F6" />
          <View className="ml-3 flex-1">
            <Text className="text-blue-800 font-medium">Device Management</Text>
            <Text className="text-blue-600 text-xs">
              Track and manage all devices logged into your account. Revoke
              access for devices you no longer use.
            </Text>
          </View>
        </View>
      </View>

      {!devices || devices.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Icon name="cellphone-off" size={64} color="#CBD5E1" />
          <Text className="text-gray-400 mt-4 text-lg">No devices found</Text>
          <Text className="text-gray-400 text-sm mt-1">
            Devices will appear here after login
          </Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.ID}
          renderItem={renderDevice}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
