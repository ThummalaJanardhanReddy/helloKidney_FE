import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { images } from "@/assets";
import Text from "./Text";
import { colors, pageTitle } from "../shared/commonStyles";

type ConditionKey =
  | "diabetes"
  | "hypertension"
  | "heart_disease"
  | "kidney_disease"
  | "brain_stroke"
  | "obesity"
  | "no_issues";

const CONDITIONS: {
  key: ConditionKey;
  label: string;
  emoji?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  image?: any;
  grayImage?: any;
}[] = [
  { key: "diabetes", label: "Diabetes", image: images.diabetes, grayImage: images.diabetesGray },
  { key: "hypertension", label: "Hypertension", image: images.hypertension, grayImage: images.hypertensionGray },
  { key: "heart_disease", label: "Heart Disease", image: images.heart, grayImage: images.heartGray },
  { key: "kidney_disease", label: "Kidney Disease earlier (AKI)", image: images.kidneyCondition, grayImage: images.kidneyConditionGray },
  { key: "brain_stroke", label: "Brain Stroke", emoji: "🧠" },
  { key: "obesity", label: "Obesity", image: images.obesity, grayImage: images.obesityGray },
  { key: "no_issues", label: "No Issues", image: images.noIssue, grayImage: images.noIssueGray },
];

export default function HealthConditionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    subjectType?: string;
    relationType?: string;
    fullName?: string;
    age?: string;
    gender?: string;
  }>();

  const [selected, setSelected] = useState<Set<ConditionKey>>(new Set());
  const [showError, setShowError] = useState(false);

  const toggleCondition = useCallback((key: ConditionKey) => {
    setShowError(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (key === "no_issues") {
        // "No Issues" is exclusive — picking it clears every other condition.
        return next.has("no_issues") ? new Set() : new Set<ConditionKey>(["no_issues"]);
      }
      // picking any real condition clears "No Issues" if it was selected.
      next.delete("no_issues");
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selected.size === 0) {
      setShowError(true);
      return;
    }
    router.push({
      pathname: "/components/TimerCameraUploader",
      params: {
        ...params,
        healthConditions: Array.from(selected).join(","),
      },
    });
  }, [params, router, selected]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Details</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>
          Do you have any of the following Health Condition?
        </Text>
        <Text style={styles.subtitle}>Select all that apply</Text>

        <View style={styles.grid}>
          {CONDITIONS.map((condition) => {
            const isSelected = selected.has(condition.key);
            return (
              <TouchableOpacity
                key={condition.key}
                style={[styles.card, isSelected && styles.cardSelected]}
                activeOpacity={0.8}
                onPress={() => toggleCondition(condition.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={condition.label}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  {condition.image ? (
                    <Image
                      source={isSelected ? condition.image : condition.grayImage ?? condition.image}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  ) : condition.iconName ? (
                    <Ionicons name={condition.iconName} size={28} color="#8B93A1" />
                  ) : (
                    // no gray artwork for this one (emoji glyphs ignore color/tint
                    // styling) — dim it instead so it still reads as "unselected"
                    <Text style={[styles.cardEmoji, !isSelected && styles.cardEmojiUnselected]}>
                      {condition.emoji}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                  numberOfLines={2}
                >
                  {condition.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showError && (
          <Text style={styles.errorText}>Please select an option to continue</Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {selected.size > 0 && (
          <Text style={styles.selectionCount}>
            {selected.size} {selected.size === 1 ? "condition" : "conditions"} selected
          </Text>
        )}
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={[styles.continueBtn, selected.size === 0 && styles.continueBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_GAP = 12;
const CONTENT_PADDING = 20;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_SIZE = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerTitle: {
    ...pageTitle,
    color: colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 22,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: "#15181F",
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: "400",
    color: "#8E97A8",
    marginTop: 4,
    marginBottom: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 10,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    gap: 9,
    shadowColor: "#2B3A55",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FFF3F2",
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: colors.white,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardEmojiUnselected: {
    opacity: 0.35,
  },
  cardImage: {
    width: 32,
    height: 32,
  },
  cardLabel: {
    fontSize: 12.5,
    fontWeight: "400",
    color: "#5B6472",
    textAlign: "center",
  },
  cardLabelSelected: {
    fontWeight: "600",
    color: "#15181F",
  },
  errorText: {
    fontSize: 12.5,
    color: colors.primary,
    marginTop: 14,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E0EAF5",
  },
  selectionCount: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  continueBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  continueBtnDisabled: {
    backgroundColor: "#F3A49C",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
