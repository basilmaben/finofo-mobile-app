import { useUser } from "@clerk/clerk-expo";
import { Image, StyleSheet, Text, View } from "react-native";
import { Avatar, useTheme } from "react-native-paper";

export const UserAvatar = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const theme = useTheme();

  if (!isLoaded || !isSignedIn) {
    return (<Avatar.Icon
      size={48}
      icon="account-circle"
      style={{ backgroundColor: theme.colors.surfaceDisabled }}
    />)
  }

  const hasImage = user.hasImage; 

  return (
    <View style={{...styles.avatarContainer, backgroundColor: theme.colors.surfaceDisabled }}>
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
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

