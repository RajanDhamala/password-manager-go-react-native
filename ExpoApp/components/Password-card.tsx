import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { copyToClipboard } from "../utils/clipboard";
import { PlatformIcon } from "./Platformicons";

interface Password {
  id: string
  platform: string
  username: string
  email?: string
  password: string
  category: "social" | "work" | "personal" | "banking" | "api-keys"
  tags: string[]
  addedDate: Date
  lastAccessed: Date
  strengthScore: number
  isBreached?: boolean
}

interface PasswordCardProps {
  password: Password
  onViewDetails: () => void
}

export function PasswordCard({ password, onViewDetails }: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(password.password);
    console.log("password copied:", ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <TouchableOpacity onPress={onViewDetails} className="bg-white rounded-lg border border-gray-200 p-4">
      <View className="flex-row items-center gap-3">
        {/* Platform Icon */}
        <PlatformIcon platform={password.platform} className="w-10 h-10" />

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold" numberOfLines={1}>{password.platform}</Text>
            {password.isBreached && <View className="w-2 h-2 bg-red-500 rounded-full" />}
          </View>
          <Text className="text-xs text-gray-500" numberOfLines={1}>{password.email || password.username}</Text>
          {password.tags.length > 0 && (
            <View className="flex-row gap-1 mt-1 flex-wrap">
              {password.tags.slice(0, 2).map((tag) => (
                <View key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-gray-600">{tag}</Text>
                </View>
              ))}
              {password.tags.length > 2 && (
                <Text className="text-xs text-gray-400">+{password.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => handleCopy()}
            className="p-2 rounded-lg"
          >
            <Feather name="copy" size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2 rounded-lg"
          >
            {showPassword ? (
              <Feather name="eye-off" size={16} color="#6b7280" />
            ) : (
              <Feather name="eye" size={16} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Display */}
      {showPassword && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <Text className="text-sm font-mono bg-gray-50 p-2 rounded" selectable>{password.password}</Text>
          {copied && <Text className="text-xs text-green-500 mt-1">Copied!</Text>}
        </View>
      )}
    </TouchableOpacity>
  )
}
