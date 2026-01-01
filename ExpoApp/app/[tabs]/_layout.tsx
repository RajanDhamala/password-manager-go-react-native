

import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import ToastManager from 'toastify-react-native';

function CustomDrawer(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 40, backgroundColor: "#F7F7F7" }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
        <Image source={{ uri: "https://i.pravatar.cc/150" }} style={{ width: 70, height: 70, borderRadius: 50, marginBottom: 10 }} />
        <Text variant="titleMedium">tinku bahadur</Text>
        <Text variant="bodySmall" style={{ color: "#555" }}>tinku@example.com</Text>
      </View>

      {/* MENU */}
      <View style={{ flex: 1 }}>
        <DrawerItem label="Home" icon={({ color, size }) => <Icon name="home" size={size} color={color} />} onPress={() => props.navigation.navigate("home")} />
        <DrawerItem label="Auth" icon={({ color, size }) => <Icon name="account" size={size} color={color} />} onPress={() => props.navigation.navigate("auth")} />
        <DrawerItem label="Settings" icon={({ color, size }) => <Icon name="cog" size={size} color={color} />} onPress={() => props.navigation.navigate("settings")} />
        <DrawerItem label="Add" icon={({ color, size }) => <Icon name="plus" size={size} color={color} />} onPress={() => props.navigation.navigate("add")} />

        <DrawerItem label="Security" icon={({ color, size }) => <Icon name="plus" size={size} color={color} />} onPress={() => props.navigation.navigate("security")} />

        <DrawerItem label="Profile" icon={({ color, size }) => <Icon name="plus" size={size} color={color} />} onPress={() => props.navigation.navigate("profile")} />

        <DrawerItem label="Db" icon={({ color, size }) => <Icon name="account" size={size} color={color} />} onPress={() => props.navigation.navigate("db")} />
      </View>

      {/* FOOTER */}
      <View style={{ padding: 20, borderTopWidth: 1, borderColor: "#ddd" }}>
        <DrawerItem
          label="Logout"
          style={{ backgroundColor: "red", borderRadius: 5 }}
          labelStyle={{ color: "white" }}
          icon={({ size }) => <Icon name="logout" size={size} color="white" />}
          onPress={() => props.navigation.reset({ index: 0, routes: [{ name: "auth" }] })}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <>
      <ToastManager />
      <Drawer
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          drawerStyle: { width: 280, backgroundColor: "#F7F7F7" },
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          drawerActiveTintColor: "#6200ee",
          drawerInactiveTintColor: "#444",
        }}
      >
        <Drawer.Screen name="home" />
        <Drawer.Screen name="auth" />
        <Drawer.Screen name="settings" />
        <Drawer.Screen name="add" />
        <Drawer.Screen name="security" />
        <Drawer.Screen name="profile" />
        <Drawer.Screen name="db" />
      </Drawer>
    </>
  );
}


