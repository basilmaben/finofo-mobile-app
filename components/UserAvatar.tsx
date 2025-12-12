import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Divider, Menu, useTheme } from "react-native-paper";

export const UserAvatar = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleSignOut = async () => {
    closeMenu();
    try {
      await signOut();
      router.replace("/modules/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <Avatar.Icon
        size={48}
        icon="account-circle"
        style={{ backgroundColor: theme.colors.surfaceDisabled }}
      />
    );
  }

  const hasImage = user.hasImage;
  const userName = user.fullName || user.primaryEmailAddress?.emailAddress || "User";

  return (
    <Menu
      visible={menuVisible}
      onDismiss={closeMenu}
      anchor={
        <TouchableOpacity onPress={openMenu} activeOpacity={0.7}>
          <View style={{ ...styles.avatarContainer, backgroundColor: theme.colors.surfaceDisabled }}>
            {hasImage && user.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.initialsContainer}>
                <Text style={styles.initialsText}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      }
      anchorPosition="bottom"
      contentStyle={styles.menuContent}
    >
      <View style={styles.menuHeader}>
        <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
          {userName}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
          {user.primaryEmailAddress?.emailAddress}
        </Text>
      </View>
      <Divider />
      <Menu.Item
        onPress={handleSignOut}
        title="Sign Out"
        leadingIcon="logout"
        titleStyle={{ color: theme.colors.error }}
      />
    </Menu>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  initialsContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  menuContent: {
    borderRadius: 12,
    minWidth: 200,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
});
