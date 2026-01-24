import { decodeToken } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import axiosClient from "../../src/services/axiosClient";
import { colors } from "../shared/commonStyles";
import { useSessionStore } from "../stores/sessionStore";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  const didInitialLoadRef = useRef(false);
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6WyIxODMzNyIsImNrZHNjcmVlbmluZ2hlYWx0aHdvcmtlckBnbWFpbC5jb20iXSwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbW9iaWxlcGhvbmUiOiI5NTAyODQ4MjQ4IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoiY2tkc2NyZWVuaW5naGVhbHRod29ya2VyQGdtYWlsLmNvbSIsImV4cCI6MTc3MjUxODIwNSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNDkvIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzNDkvIn0.hsRL-yTEyyobALMJdMIAuSrE1m2WWCZTMsGXmn-ubss";
    const token1 =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo0NDM0OS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo0NDM0OS8iLCJleHAiOjE3NzQyNzEyMTYsImlhdCI6MTc2OTA4NzIxNiwic3ViIjoiMiIsInVzZXJuYW1lIjoiamFuYXJkaGFuIHRodW1tYWxhIiwibW9iaWxlIjoiODk3ODI5ODI4OSIsImVtYWlsIjoiamFuYUB0ZXN0LmNvbSJ9.YaDv9jBaFvpSlENSa8YGlhla_BoIwntAAymTI799ets";
    const appBearer = decodeToken(token1);
    const bearer = decodeToken(token);
    console.log("decoded fixed token:", bearer);
    console.log("decoded app token:", appBearer);
  }, []);

  const fetchTests = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      if (pageNumber === 1 && !refresh) setLoading(true);
      if (!session?.userId) return;

      const data = await axiosClient.get<testResponse[]>("/users/tests", {
        params: { patient_Id: session.userId },
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
    }, [params.refresh]),
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

  const formatDate = (date: string, tz = dayjs.tz.guess()) => {
    const fixed = date.includes(".")
      ? date.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}).*$/, "$1")
      : date;

    const _d = fixed.endsWith("Z") ? fixed : fixed + "Z";
    const parsedDate = dayjs(_d).format("DD MMM YYYY: hh:mm A");

    return parsedDate;
  };

  // const formatDate = (date: string) => {
  //   const d = new Date(date);

  //   const datePart = d.toLocaleDateString("en-GB", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //   });

  //   const timePart = d.toLocaleTimeString("en-US", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: true,
  //   });

  //   return `${datePart}: ${timePart}`;
  // };

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
        <Ionicons name="document-text-outline" size={26} />
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
      ) : tests.length > 0 ? (
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
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>No Tests Found.</Text>
        </View>
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
