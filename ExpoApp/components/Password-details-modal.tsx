import { Feather } from "@expo/vector-icons"
import React, { useState } from "react"
import { Alert, Text, TouchableOpacity, View } from "react-native"
import { copyToClipboard } from "../utils/clipboard"
import { PlatformIcon } from "./Platformicons"

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

interface PasswordDetailsModalProps {
  isOpen: boolean
  password: Password
  onClose: () => void
  onDelete: () => void
}

export function PasswordDetailsModal({ isOpen, password, onClose, onDelete }: PasswordDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(password.password);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleDelete = () => {
    Alert.alert("Delete password", `Are you sure you want to delete the password for ${password.platform}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ])
  }

  if (!isOpen) return null

  const strengthColor =
    password.strengthScore >= 80 ? "text-green-500" : password.strengthScore >= 60 ? "text-yellow-500" : "text-red-500"

  const lastAccessedDate = new Date(password.lastAccessed)
  const addedDate = new Date(password.addedDate)
  const daysSinceAccess = Math.floor((Date.now() - lastAccessedDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <View className="absolute inset-0 bg-black/50 z-50 justify-end w-full">
      <View className="w-full bg-white rounded-t-2xl border border-gray-200 p-6 max-h-[90%]">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold">Password Details</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Feather name="x" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Platform Header */}
        <View className="flex-row items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <PlatformIcon platform={password.platform} className="w-16 h-16" />
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold">{password.platform}</Text>
              {password.isBreached && (
                <Text className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full">⚠ Breached</Text>
              )}
            </View>
            <Text className="text-sm text-gray-500 mt-1">{password.email || password.username}</Text>
          </View>
        </View>

        {/* Details */}
        <View className="gap-4 mb-6">
          {/* Username */}
          <View className="bg-gray-100 rounded-lg p-3">
            <Text className="text-xs font-medium text-gray-500 mb-1">Username</Text>
            <Text className="text-sm font-mono">{password.username}</Text>
          </View>

          {/* Password */}
          <View className="bg-gray-100 rounded-lg p-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-medium text-gray-500">Password</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? (
                    <Feather name="eye-off" size={16} color="#6b7280" />
                  ) : (
                    <Feather name="eye" size={16} color="#6b7280" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCopy} className="p-1">
                  <Feather name="copy" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-sm font-mono">
              {showPassword ? password.password : "•".repeat(12)}
            </Text>
            {copied && <Text className="text-xs text-green-500 mt-2">Copied to clipboard!</Text>}
          </View>

          {/* Strength */}
          <View className="bg-gray-100 rounded-lg p-3">
            <Text className="text-xs font-medium text-gray-500 mb-1">Password Strength</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                <View
                  className={`h-2 rounded-full ${
                    password.strengthScore >= 80
                      ? "bg-green-500"
                      : password.strengthScore >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${password.strengthScore}%` }}
                />
              </View>
              <Text className={`text-sm font-bold ${
                password.strengthScore >= 80 ? "text-green-500" : password.strengthScore >= 60 ? "text-yellow-500" : "text-red-500"
              }`}>{password.strengthScore}%</Text>
            </View>
          </View>

          {/* Tags */}
          {password.tags.length > 0 && (
            <View className="bg-gray-100 rounded-lg p-3">
              <Text className="text-xs font-medium text-gray-500 mb-2">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {password.tags.map((tag) => (
                  <View key={tag} className="bg-white px-2 py-1 rounded-full">
                    <Text className="text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dates */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-gray-100 rounded-lg p-3">
              <Text className="text-xs font-medium text-gray-500 mb-1">Added</Text>
              <Text className="text-sm">{addedDate.toLocaleDateString()}</Text>
            </View>
            <View className="flex-1 bg-gray-100 rounded-lg p-3">
              <Text className="text-xs font-medium text-gray-500 mb-1">Last Accessed</Text>
              <Text className="text-sm">{daysSinceAccess === 0 ? "Today" : `${daysSinceAccess} days ago`}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={onClose} className="flex-1 border border-gray-300 rounded-lg px-4 py-3 items-center">
            <Text>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} className="flex-1 bg-red-500 rounded-lg px-4 py-3 items-center">
            <Text className="text-white">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
