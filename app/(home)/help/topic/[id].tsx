import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../../components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/app/shared/commonStyles";
import { helpTopics } from "@/app/shared/helpContent";

export default function HelpTopicScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = helpTopics.find((t) => t.id === id) ?? helpTopics[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <StatusBar style="dark" backgroundColor={colors.white} animated />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.question}>{topic.question}</Text>
        <Text style={styles.answer}>{topic.answer}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 40,
  },
  question: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 14,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3F4B",
  },
});
