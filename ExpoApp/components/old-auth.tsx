
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Toast } from 'toastify-react-native';
import { useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

// Needed to complete auth session
WebBrowser.maybeCompleteAuthSession();

const OAUTH_BASE = "http://192.168.18.26:8000/auth"; // your backend OAuth endpoint
const SCHEME = "build"; // must match "scheme" in app.json

export default function PasswordManagerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email / Password login/register
  const postData = async ({ type, email, password }) => {
    const endpoint = `http://192.168.18.26:8000:8000/user/${type}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const authMutation = useMutation({
    mutationFn: (vars) => postData(vars),
    onSuccess: (data) => {
      Toast.success(data.message || "Success!");
    },
    onError: (err) => {
      Toast.error(err.message || "Something went wrong");
    }
  });

  const handleEmailAuth = () => {
    if (!email || !password) {
      Toast.error("Please fill all fields");
      return;
    }
    const type = isLogin ? "login" : "register";
    authMutation.mutate({ type, email, password });
  };

  // OAuth login
  const handleOAuth = async (provider: string) => {
    try {
      const redirectUri = `${SCHEME}://redirect`; // deep link back to app
      const authUrl = `${OAUTH_BASE}/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const urlParams = new URLSearchParams(result.url.split("?")[1]);
        const token = urlParams.get("token");

        if (token) {
          Toast.success(`${provider} login successful!`);
          console.log("JWT Token:", token);
          // TODO: store token in secure storage or state
        } else {
          Toast.error("No token returned by backend");
        }
      } else if (result.type === 'dismiss') {
        Toast.error("Browser closed before login");
      } else {
        Toast.error("OAuth cancelled");
      }
    } catch (err) {
      Toast.error("OAuth error occurred");
      console.error(err);
    }
  };

  const loading = authMutation.isPending;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      className="bg-slate-50 px-6"
    >
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center mb-4">
          <Icon name="lock" size={38} color="blue" />
        </View>
        <Text className="text-4xl font-bold text-slate-800 mb-1">
          {isLogin ? 'Welcome_Back' : 'Create Account'}
        </Text>
        <Text className="text-m text-slate-500">
          {isLogin ? 'Sign in to access your vault' : 'Start securing your passwords'}
        </Text>
      </View>

      <View className="space-y-4 mb-6">
        <View>
          <Text className="text-slate-700 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-800"
          />
        </View>

        <View>
          <Text className="text-slate-700 mb-1">Password</Text>
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-800"
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

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-slate-300" />
        <Text className="px-2 text-slate-500 text-sm">or continue with</Text>
        <View className="flex-1 h-px bg-slate-300" />
      </View>

      <View className="space-y-3 mb-6 gap-2">
        <TouchableOpacity
          onPress={() => handleOAuth('google')}
          className="flex-row items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-lg"
        >
          <Icon name="google" size={20} color="#4285F4" />
          <Text className="text-slate-800 font-medium">Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleOAuth('github')}
          className="flex-row items-center justify-center gap-3 px-4 py-3 bg-slate-800 rounded-lg"
        >
          <Icon name="github" size={20} color="white" />
          <Text className="text-white font-medium">Continue with GitHub</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="items-center">
        <Text className="text-blue-600 font-medium">
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

