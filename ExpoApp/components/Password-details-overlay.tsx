import { Feather } from "@expo/vector-icons"
import React, { useState } from "react"
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { copyToClipboard } from "../utils/clipboard"
import { PlatformIcon } from "./Platformicons"

export function PasswordDetailsOverlay({ isOpen, password, onClose, onDelete }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !password) return null

  const handleCopy = async () => {
    const ok = await copyToClipboard(password.password)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = () => {
    Alert.alert("Delete password", `Are you sure you want to delete ${password.platform}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ])
  }

  const lastAccessedDate = new Date(password.lastAccessed)
  const addedDate = new Date(password.addedDate)
  const daysSinceAccess = Math.floor((Date.now() - lastAccessedDate.getTime()) / 86400000)

  return (
    <>
      {/* BACKDROP */}
      <View className="absolute inset-0 bg-black/50 z-40" />

      {/* BOTTOM SHEET */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border border-gray-200 z-50 max-h-[90%] px-2 pt-4">
        
        {/* SCROLLABLE CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
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
              <Text className="text-2xl font-bold">{password.platform}</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {password.email || password.username}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View className="gap-4 mb-6">
            {/* Username */}
            <View className="bg-gray-100 rounded-lg p-3">
              <Text className="text-xs text-gray-500 mb-1">Username</Text>
              <Text className="text-sm font-mono">{password.username}</Text>
            </View>

            {/* Password */}
            <View className="bg-gray-100 rounded-lg p-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-medium text-gray-500">Password</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCopy}>
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
              <Text className="text-xs text-gray-500 mb-1">Password Strength</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${password.strengthScore}%`,
                      backgroundColor:
                        password.strengthScore >= 80
                          ? "green"
                          : password.strengthScore >= 60
                          ? "yellow"
                          : "red",
                    }}
                  />
                </View>
                <Text>{password.strengthScore}%</Text>
              </View>
            </View>

            {/* Tags */}
            {password.tags.length > 0 && (
              <View className="bg-gray-100 rounded-lg p-3">
                <Text className="text-xs text-gray-500 mb-1">Tags</Text>
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
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-gray-100 rounded-lg p-3">
                <Text className="text-xs text-gray-500 mb-1">Added</Text>
                <Text className="text-sm">{addedDate.toLocaleDateString()}</Text>
              </View>
              <View className="flex-1 bg-gray-100 rounded-lg p-3">
                <Text className="text-xs text-gray-500 mb-1">Last Accessed</Text>
                <Text className="text-sm">
                  {daysSinceAccess === 0 ? "Today" : `${daysSinceAccess} days ago`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Buttons */}
        <View className="flex-row gap-3 pb-6 pt-2">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 items-center"
          >
            <Text>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="flex-1 bg-red-500 rounded-lg px-4 py-3 items-center"
          >
            <Text className="text-white">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}
