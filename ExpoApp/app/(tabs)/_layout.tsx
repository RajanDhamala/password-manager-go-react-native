import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import ToastManager from "toastify-react-native";


export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <ToastManager />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingBottom: 20,
            paddingTop: 10,
            height: 70,
          },
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "My Vault",
            tabBarLabel: "Vault",
            tabBarIcon: ({ color, size }) => (
              <Icon name="shield-lock" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add Password",
            tabBarLabel: "Add",
            tabBarIcon: ({ color, size }) => (
              <Icon name="plus-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Settings",
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Icon name="cog" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            href: null,
            title: "My Devices",
          }}
        />
        <Tabs.Screen
          name="auth"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </View>
  );
}
