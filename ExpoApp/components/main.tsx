import { Feather } from "@expo/vector-icons"
import React, { useMemo, useState } from "react"
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import AddPasswordModal from "./Add-password-modal"
import { AnalyticsSection } from "./Analytics-section"
import { PasswordCard } from "./Password-card"
import { PasswordDetailsOverlay } from "./Password-details-overlay"

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

const CATEGORY_OPTIONS = [
  { id: "all", label: "All", color: "bg-blue-500" },
  { id: "social", label: "Social", color: "bg-purple-500" },
  { id: "work", label: "Work", color: "bg-cyan-500" },
  { id: "personal", label: "Personal", color: "bg-green-500" },
  { id: "banking", label: "Banking", color: "bg-amber-500" },
  { id: "api-keys", label: "API Keys", color: "bg-pink-500" },
]

const MOCK_PASSWORDS: Password[] = [
  {
    id: "1",
    platform: "Gmail",
    username: "alex.smith",
    email: "alex.smith@gmail.com",
    password: "SecurePass123!",
    category: "personal",
    tags: ["email", "important"],
    addedDate: new Date("2024-01-15"),
    lastAccessed: new Date("2024-12-01"),
    strengthScore: 92,
  },
  {
    id: "2",
    platform: "GitHub",
    username: "alex-smith",
    email: "alex.smith@gmail.com",
    password: "GitHubPass456@",
    category: "work",
    tags: ["dev", "coding"],
    addedDate: new Date("2024-02-20"),
    lastAccessed: new Date("2024-11-28"),
    strengthScore: 88,
  },
  {
    id: "3",
    platform: "Facebook",
    username: "alex.smith.98",
    email: "alex.smith@gmail.com",
    password: "FacePass789#",
    category: "social",
    tags: ["social"],
    addedDate: new Date("2024-03-10"),
    lastAccessed: new Date("2024-11-15"),
    strengthScore: 75,
    isBreached: true,
  },
  {
    id: "4",
    platform: "Netflix",
    username: "alex.smith",
    email: "alex.smith@gmail.com",
    password: "NetflixPass999!",
    category: "personal",
    tags: ["streaming"],
    addedDate: new Date("2024-04-05"),
    lastAccessed: new Date("2024-12-02"),
    strengthScore: 85,
  },
  {
    id: "5",
    platform: "Spotify",
    username: "alex.smith.fb",
    email: "alex.smith@gmail.com",
    password: "SpotPass321$",
    category: "personal",
    tags: ["streaming", "music"],
    addedDate: new Date("2024-05-12"),
    lastAccessed: new Date("2024-11-30"),
    strengthScore: 80,
  },
  {
    id: "6",
    platform: "Stripe",
    username: "stripe_key_live_123",
    password: "sk_live_abc123xyz789",
    category: "api-keys",
    tags: ["payments", "api"],
    addedDate: new Date("2024-06-18"),
    lastAccessed: new Date("2024-12-02"),
    strengthScore: 95,
  },
]

export default function HomePage() {
  const [passwords, setPasswords] = useState<Password[]>(MOCK_PASSWORDS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null)
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false)

  // Filter and search passwords
  const filteredPasswords = useMemo(() => {
    return passwords.filter((pwd) => {
      const matchesCategory = selectedCategory === "all" || pwd.category === selectedCategory
      const matchesSearch =
        searchQuery === "" ||
        pwd.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pwd.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pwd.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pwd.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [passwords, searchQuery, selectedCategory])

  const handleAddPassword = (newPassword: Omit<Password, "id">) => {
    setPasswords([
      ...passwords,
      {
        ...newPassword,
        id: String(passwords.length + 1),
      },
    ])
    setIsAddModalOpen(false)
  }

  const handleDeletePassword = (id: string) => {
    setPasswords(passwords.filter((pwd) => pwd.id !== id))
    setShowDetailsOverlay(false)
  }

  return (
    <ScrollView className="min-h-screen bg-white p-4 ">
      {/* Header */}
      <View className="pt-6 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold mb-1">Welcome back, Alex!</Text>
        <Text className="text-sm text-gray-500">Manage your passwords securely</Text>
      </View>

      {/* Search Bar */}
      <View className="mt-6 mb-6 relative">
        <Feather name="search" size={18} color="#6b7280" style={{ position: "absolute", left: 12, top: 14 }} />
        <TextInput
          placeholder="Search by username, platform, tags..."
          className="pl-10 pr-3 py-3 bg-gray-100 rounded-lg"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        <View className="flex-row gap-2 pb-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? `${cat.color} ` + 'text-white' : 'bg-gray-100'}`}
            >
              <Text className={`${selectedCategory === cat.id ? 'text-white' : 'text-gray-800'}`}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-8">
        <TouchableOpacity onPress={() => setIsAddModalOpen(true)} className="flex-1 bg-blue-500 rounded-lg px-4 py-3 items-center">
          <View className="flex-row items-center">
            <Feather name="plus" size={16} color="#fff" />
            <Text className="text-white ml-2">Add New</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 border border-gray-300 rounded-lg px-4 py-3 items-center">
          <View className="flex-row items-center">
            <Feather name="rotate-cw" size={16} color="#111827" />
            <Text className="ml-2">Generate</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity className="px-3 border border-gray-300 rounded-lg items-center justify-center">
          <Feather name="settings" size={16} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Analytics */}
      <AnalyticsSection passwords={passwords} />

      {/* Passwords List */}
      <View>
        <Text className="text-lg font-semibold mt-4 mb-4">Stored Accounts</Text>
        {filteredPasswords.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-gray-500">No passwords found. Add one to get started!</Text>
          </View>
        ) : (
          filteredPasswords.map((password) => (
            <View key={password.id} className="mb-3">
              <PasswordCard
                password={password}
                onViewDetails={() => {
                  setSelectedPassword(password)
                  setShowDetailsOverlay(true)
                }}
              />
            </View>
          ))
        )}
      </View>

      {/* Modals */}
      <AddPasswordModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddPassword} />

      {/* Password Details Overlay */}
      {selectedPassword && (
        <PasswordDetailsOverlay
          isOpen={showDetailsOverlay}
          password={selectedPassword}
          onClose={() => setShowDetailsOverlay(false)}
          onDelete={() => handleDeletePassword(selectedPassword.id)}
        />
      )}
    </ScrollView>
  )
}
