
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Toast } from 'toastify-react-native';
import { } from "../../utils/crypto"
import { generateRandomAESKey } from "../../utils/crypto";

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  message?: string;
}

export default function PasswordManagerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://192.168.18.26:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: AuthResponse = await res.json();
      console.log('Login response data:', data);
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data;
    },
    onSuccess: async (data) => {
      Toast.success(data.message || 'Logged in successfully!');

      console.log('Login response data:', data);
      // Optionally store tokens in AsyncStorage
      // AsyncStorage.setItem('accessToken', data.accessToken)
      try {
        if (data.accessToken) {
          await SecureStore.setItemAsync('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        }
        console.log('Tokens saved securely!');
        const aestoken = generateRandomAESKey();
        if (!aestoken) console.log("failed to generate aes token")
        await SecureStore.setItemAsync("aesKey", aestoken)
        console.log("token successfully saved to db");
      } catch (e) {
        console.log('Failed to save tokens:', e);
      }
    },
    onError: (err: any) => {
      Toast.error(err.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://192.168.18.26:8080/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password }),
      });
      const data: AuthResponse = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      return data;
    },
    onSuccess: (data) => {
      Toast.success(data.message || 'Registered successfully!');
      // Optionally store tokens in AsyncStorage
      // AsyncStorage.setItem('accessToken', data.accessToken)
    },
    onError: (err: any) => {
      Toast.error(err.message || 'Registration failed');
    },
  });

  const handleEmailAuth = () => {
    if (!email || !password || (!isLogin && !fullname)) {
      Toast.error('Please fill all fields');
      return;
    }
    if (isLogin) loginMutation.mutate();
    else registerMutation.mutate();
  };

  const loading = isLogin ? loginMutation.isPending : registerMutation.isPending;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
    >
      {/* HEADER */}
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
          <Icon name="lock" size={38} color="white" />
        </View>
        <Text className="text-4xl font-bold mb-1">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text className="text-base text-gray-500">
          {isLogin ? 'Sign in to access your vault' : 'Start securing your passwords'}
        </Text>
      </View>

      {/* FORM */}
      <View className="space-y-4 mb-6 ">
        {!isLogin && (
          <View>
            <Text className="mb-1">Full Name</Text>
            <TextInput
              value={fullname}
              onChangeText={setFullname}
              placeholder="John Doe"
              autoCapitalize="words"
              className=" w-full px-4 py-3 border rounded-lg bg-white"
            />

          </View>
        )}

        <View>
          <Text className="mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full px-4 py-3 border rounded-lg bg-white"
          />
        </View>

        <View>
          <Text className="mb-1">Password</Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              className="w-full px-4 py-3 border rounded-lg bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded-lg items-center mt-3"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center">
        <Text className="text-blue-600 font-medium">
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

