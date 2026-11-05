import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, Linking, Share, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../../components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/app/shared/commonStyles";
import { helpVideos, getYoutubeThumbnail } from "@/app/shared/helpContent";

export default function HelpVideoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const video = helpVideos.find((v) => v.id === id) ?? helpVideos[0];

  const handleWatch = () => Linking.openURL(video.videoUrl);
  const handleShare = () => {
    Share.share({ message: `${video.title}\n${video.videoUrl}` });
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
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.description}>{video.description}</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.thumb}
          onPress={handleWatch}
        >
          <Image
            source={{ uri: getYoutubeThumbnail(video.youtubeId) }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[StyleSheet.absoluteFillObject, styles.thumbOverlay]} />
          <View style={styles.playBtn}>
            <Ionicons name="play" size={26} color={colors.primary} />
          </View>

          <View style={styles.thumbFooter}>
            <TouchableOpacity hitSlop={10} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.watchBtn}
              onPress={handleWatch}
            >
              <Ionicons name="logo-youtube" size={18} color="#FF3B30" />
              <Text style={styles.watchBtnText}>Watch Demo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3A3F4B",
    marginBottom: 20,
  },
  thumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    backgroundColor: "#C7CBD1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbOverlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1C1C1E",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  watchBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
});
