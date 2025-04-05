import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phoneNumber, otp } = useLocalSearchParams<{
    phoneNumber: string;
    otp: string;
  }>();

  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const updatedDigits = [...otpDigits];
    updatedDigits[index] = text;
    setOtpDigits(updatedDigits);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verifyCode = () => {
    const enteredCode = otpDigits.join("");
    if (enteredCode === otp) {
      Alert.alert("Success", "OTP verified!");
      router.push("/(tabs)");
    } else {
      Alert.alert("Invalid", "Incorrect OTP");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔢</Text>
          <Text style={styles.headerTitle}>OTP</Text>
          <Text style={styles.headerSubtitle}>
            Please enter the OTP sent to your mobile number
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.otpContainer}>
            {otpDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref!)}
                value={digit}
                onChangeText={(text) => handleChange(text.slice(-1), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.otpInput}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={verifyCode}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>

          <Text style={styles.resendText}>
            Didn’t receive an OTP?{" "}
            <Text style={{ color: "#4f46e5", fontWeight: "500" }}>Resend OTP</Text>
          </Text>
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 20,
    color: "#000",
  },
  button: {
    backgroundColor: "#4D9F8D",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendText: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
