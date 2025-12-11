import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const Dashboard = () => {
  const { user } = useUser();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Hello {user?.primaryEmailAddress?.emailAddress ?? "there"} 👋
      </Text>
      <Text style={styles.subtitle}>Welcome to the mobile app dashboard.</Text>

      <TouchableOpacity
        style={[styles.button, { marginTop: 24 }]}
        onPress={() => router.push("/modules/PurchaseOrders/Table")}
      >
        <Text style={styles.buttonText}>View Purchase Orders</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    color: "#F9FAFB",
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
});