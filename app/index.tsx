import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");

  const sendOtp = async () => {
    if (!phoneNumber || !userName) {
      Alert.alert("Missing Information", "Please enter both your username and phone number.");
      return;
    }

    try {
      const code = Math.floor(100000 + Math.random() * 900000); // Mock OTP
      console.log("OTP sent:", code);

      router.push({
        pathname: "/verifyOtp",
        params: { phoneNumber, otp: code.toString() },
      });
    } catch (err) {
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.headerTitle}>Mobile Number</Text>
          <Text style={styles.headerSubtitle}>
            We need to send OTP to authenticate your number
          </Text>
        </View>

        <View style={styles.body}>
           <Text style={styles.label}>Username</Text>
          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your username"
            style={styles.input}
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            style={styles.input}
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity style={styles.button} onPress={sendOtp}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    backgroundColor: "#4D9F8D",
    paddingVertical: 40,
    alignItems: "center",
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#eee",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  body: {
    padding: 24,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4D9F8D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#fff",
  },
});
