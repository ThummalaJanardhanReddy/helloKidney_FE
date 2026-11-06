import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Text from "./Text";
import { colors, pageTitle } from "../shared/commonStyles";

type Subject = "self" | "other";

const OPTIONS: {
  key: Subject;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  caption: string;
}[] = [
  {
    key: "self",
    icon: "person",
    title: "Self",
    caption: "Take the test for yourself",
  },
  {
    key: "other",
    icon: "people",
    title: "Others",
    caption: "Take the test for a family member",
  },
];

export default function StartTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Subject | null>(null);

  const handleSelect = (subject: Subject) => {
    setSelected(subject);
    // replace (not push): this screen is a transparentModal, and native
    // stack modals always render above regular "card" screens regardless of
    // push order — pushing the next screen left it mounted underneath this
    // modal instead of on top. Replacing swaps this modal out for the next
    // screen instead of stacking a card beneath it.
    if (subject === "self") {
      router.replace({
        pathname: "/components/health-conditions",
        params: { subjectType: "self" },
      });
    } else {
      router.replace({ pathname: "/components/other-patient-details" });
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => router.back()}
        accessibilityLabel="Dismiss"
      />

      {/* No flex:1 here — the sheet sizes itself to its content instead of
          filling the screen, so it only takes up as much height as the
          header + cards actually need. */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Start uACR Test</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={10}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={18} color="#6B82A0" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Who is this test for?</Text>

        <View style={styles.cardsColumn}>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.card, selected === option.key && styles.cardSelected]}
              activeOpacity={0.8}
              onPress={() => handleSelect(option.key)}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={styles.cardIconWrap}>
                <Ionicons name={option.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardCaption}>{option.caption}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 22,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    ...pageTitle,
    color: colors.black,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F4FA",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  cardsColumn: {
    gap: 12,
  },
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardSelected: {
    borderColor: colors.borderLight,
  },
  cardTextWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },
  cardCaption: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDE8E6",
    alignItems: "center",
    justifyContent: "center",
  },
});
