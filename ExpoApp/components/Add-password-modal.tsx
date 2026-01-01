
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

const PLATFORMS = [
  "Gmail",
  "Google",
  "GitHub",
  "Facebook",
  "Netflix",
  "Spotify",
  "Twitter",
  "LinkedIn",
  "Stripe",
  "AWS",
  "Twitch",
];

const CATEGORIES = [
  { value: "social", label: "Social" },
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "banking", label: "Banking" },
  { value: "api-keys", label: "API Keys" },
];

type AddPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
};

export default function AddPasswordModal({
  isOpen,
  onClose,
  onAdd,
}: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    platform: "",
    username: "",
    email: "",
    password: "",
    category: "personal",
    tags: "",
  });

  const [showPlatformOptions, setShowPlatformOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 25;
    return Math.min(score, 100);
  };

  const handleSubmit = () => {
    if (!formData.platform || !formData.username || !formData.password) {
      Alert.alert(
        "Missing info",
        "Please fill in all required fields (platform, username, password)"
      );
      return;
    }

    onAdd({
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      addedDate: new Date(),
      lastAccessed: new Date(),
      strengthScore: calculateStrength(formData.password),
    });

    setFormData({
      platform: "",
      username: "",
      email: "",
      password: "",
      category: "personal",
      tags: "",
    });
  };

  if (!isOpen) return null;

  return (
    <View className="absolute inset-0 bg-black/50 justify-end">
      <View className="w-full bg-white rounded-t-2xl p-6 max-h-[92%]">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">Add New Password</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Platform */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Platform *</Text>

            <TouchableOpacity
              onPress={() => setShowPlatformOptions(!showPlatformOptions)}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2"
            >
              <Text>{formData.platform || "Select platform"}</Text>
            </TouchableOpacity>

            {showPlatformOptions && (
              <View className="bg-white border border-gray-300 mt-1 rounded-lg max-h-40">
                <ScrollView>
                  {PLATFORMS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setFormData({ ...formData, platform: item });
                        setShowPlatformOptions(false);
                      }}
                      className="px-3 py-2"
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Username */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Username *</Text>
            <TextInput
              placeholder="Enter username"
              value={formData.username}
              onChangeText={(text) =>
                setFormData({ ...formData, username: text })
              }
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Email</Text>
            <TextInput
              placeholder="Enter email (optional)"
              value={formData.email}
              onChangeText={(text) =>
                setFormData({ ...formData, email: text })
              }
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Password *</Text>
            <TextInput
              placeholder="Enter password"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <Text className="text-xs mt-1">
              Strength: {calculateStrength(formData.password)}%
            </Text>
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">Category</Text>

            <TouchableOpacity
              onPress={() => setShowCategoryOptions(!showCategoryOptions)}
              className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2"
            >
              <Text>
                {
                  CATEGORIES.find((c) => c.value === formData.category)?.label
                }
              </Text>
            </TouchableOpacity>

            {showCategoryOptions && (
              <View className="bg-white border border-gray-300 mt-1 rounded-lg max-h-40">
                <ScrollView>
                  {CATEGORIES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setFormData({ ...formData, category: item.value });
                        setShowCategoryOptions(false);
                      }}
                      className="px-3 py-2"
                    >
                      <Text>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Tags */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">
              Tags (comma separated)
            </Text>
            <TextInput
              placeholder="e.g. important, work, 2fa"
              value={formData.tags}
              onChangeText={(text) =>
                setFormData({ ...formData, tags: text })
              }
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4 mb-10">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 items-center justify-center"
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-1 bg-blue-500 rounded-lg px-3 py-2 items-center justify-center"
            >
              <Text className="text-white">Add Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

