import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import React from "react";
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, pageTitle } from "@/app/shared/commonStyles";
import {
  helpVideos,
  helpTopics,
  HELP_SUPPORT_EMAIL,
  HELP_SUPPORT_MAILTO,
  getYoutubeThumbnail,
} from "@/app/shared/helpContent";
import { useUserStore } from "@/app/stores/userStore";

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const isHealthWorker = useUserStore((s) => s.user?.userType) === "healthworker";
  const audience = isHealthWorker ? "healthworker" : "patient";
  const videos = helpVideos.filter(
    (v) => v.audience === "both" || v.audience === audience
  );
  const topics = helpTopics.filter(
    (t) => t.audience === "both" || t.audience === audience
  );

  // Linking.openURL with a mailto: hands it off to the OS, which opens the
  // device's default mail app (iOS/Android).
  const handleEmailUs = () => {
    Linking.openURL(`mailto:${HELP_SUPPORT_MAILTO}`);
  };

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
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Recommended videos</Text>
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            activeOpacity={0.85}
            style={styles.videoCard}
            onPress={() => router.push(`/help/video/${video.id}`)}
          >
            <View style={styles.videoThumb}>
              <Image
                source={{ uri: getYoutubeThumbnail(video.youtubeId) }}
                resizeMode="cover"
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[StyleSheet.absoluteFillObject, styles.videoThumbOverlay]} />
              <View style={styles.playBtn}>
                <Ionicons name="play" size={20} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.videoTitle}>{video.title}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
          Help Topics
        </Text>
        <View style={styles.topicsCard}>
          {topics.map((topic, index) => (
            <TouchableOpacity
              key={topic.id}
              activeOpacity={0.7}
              style={[
                styles.topicRow,
                index === topics.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => router.push(`/help/topic/${topic.id}`)}
            >
              <Text style={styles.topicText}>{topic.question}</Text>
              <Ionicons name="chevron-forward" size={20} color="#8A8F99" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.emailCard}
          onPress={handleEmailUs}
        >
          <View style={styles.emailIconWrap}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emailTitle}>Email us</Text>
            <Text style={styles.emailSubtitle}>{HELP_SUPPORT_EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8A8F99" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...pageTitle,
    color: colors.black,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 12,
  },
  videoCard: {
    marginBottom: 8,
  },
  videoThumb: {
    width: "62%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: "#C7CBD1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  videoThumbOverlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    width: "62%",
  },
  topicsCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicText: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.bg_primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
  },
  emailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6D7DB",
    alignItems: "center",
    justifyContent: "center",
  },
  emailTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
  },
  emailSubtitle: {
    fontSize: 13,
    color: "#5B6170",
    marginTop: 2,
  },
});
