import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../shared/commonStyles";

export default function VerifyOtp() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");

  const onVerify = async () => {
    // 🔗 CALL API HERE
    // await verifyOtp(email, otp);

    router.push({
      pathname: "/components/reset-password",
      params: { email, otp },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the OTP sent to {email}
      </Text>

      <TextInput
        placeholder="Enter OTP"
        placeholderTextColor={colors.black}
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.button} onPress={onVerify}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
