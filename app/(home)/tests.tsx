import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../shared/commonStyles";
import axiosClient from "../shared/services/axiosClient";

type testResponse = {
  id: number;
  patient_id: number;
  test_id: number;
  input_image_path: string;
  output_image_path: string;
  output_image_name: string;
  output_metrics: string;
  created_timestamp: string;
};

export default function TestList() {
  const router = useRouter();

  const [tests, setTests] = useState<testResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const didInitialLoadRef = React.useRef(false);

  const fetchTests = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      if (pageNumber === 1 && !refresh) setLoading(true);

      const data = await axiosClient.get<testResponse[]>("/users/tests", {
        params: { patient_Id: 123 },
      });

      setTests(refresh ? data : [...tests, ...data]);
      setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch tests", err);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsMoreLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!didInitialLoadRef.current) {
        fetchTests(1);
        didInitialLoadRef.current = true;
        return;
      }
      if (params.refresh === "true") {
        fetchTests(1, true);
  
        // 🔥 clear the flag so it doesn't refetch again
        setTimeout(() => {
          router.setParams({ refresh: undefined });
        }, 0);
      }
    }, [params.refresh])
  );

  // useEffect(() => {
  //   fetchTests(1);
  // }, []);

  const onRefresh = useCallback(() => {
    setHasMore(true);
    fetchTests(1, true);
  }, []);

  const loadMore = () => {
    if (!isMoreLoading && hasMore) {
      setIsMoreLoading(true);
    }
  };

  const SkeletonCard = () => (
    <Animatable.View
      animation="pulse"
      easing="ease-out"
      iterationCount="infinite"
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonIcon} />
      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "50%", marginTop: 8 }]} />
      </View>
    </Animatable.View>
  );

  const formatDate = (date: string) => {
    const d = new Date(date);

    const datePart = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timePart = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart}: ${timePart}`;
  };

  const renderItem = ({ item }: { item: testResponse }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        router.push({
          pathname: "/components/test-results",
          params: { result: JSON.stringify({ result: item.output_metrics }) },
        })
      }
    >
      <View style={styles.iconBox}>
        <Ionicons name="document-text-outline" size={26} color="#4A90E2" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.testId}>Test ID: {item.test_id}</Text>
        <Text style={styles.dateTime}>
          {formatDate(item.created_timestamp)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Test List</Text>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item, index) => `${item.id}-${index}`} // ✅ Fix duplicate keys
          renderItem={renderItem}
          contentContainerStyle={{
            paddingVertical: 0,
            paddingBottom: 0, // ✅ Remove bottom space
          }}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            isMoreLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : null
          }
          ListFooterComponentStyle={{
            paddingBottom: 0, // ✅ Remove footer space
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    backgroundColor: colors.bg_home,
    padding: 20,
  },
  headerText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },

  item: {
    backgroundColor: "#fff",
    padding: 16,
    // borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    // shadowColor: "#000",
    // shadowOpacity: 0.06,
    // shadowRadius: 6,
    // elevation: 3,
    borderColor: colors.border,
    borderWidth: 1,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#ECF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  testId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  dateTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  skeletonCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
    opacity: 0.7,
  },

  skeletonIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#DCE4EE",
    marginRight: 14,
  },

  skeletonLine: {
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    width: "70%",
  },
});
