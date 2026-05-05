import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
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
import { useUserStore } from "../stores/userStore";
import { IPatient } from "@/src/utils/constants";

dayjs.extend(utc);
dayjs.extend(timezone);

// Types
type TestResponse = {
  id: number;
  patient_id: number;
  test_id: number;
  input_image_path: string;
  output_image_path: string;
  output_image_name: string;
  output_metrics: string;
  created_timestamp: string;
};

type HealthworkerTestResponse = {
  id: number;
  patient_id: number;
  patient_uniqueid: string;
  test_id: number;
  isactive: boolean;
  output_metrics: string;
  created_on: string;
  hw_id: number;
  full_name: string;
};

type FetchTestsParams = {
  pageNumber?: number;
  refresh?: boolean;
};

// Constants
const SKELETON_CARD_COUNT = 6;
const END_REACHED_THRESHOLD = 0.3;
const LOADING_INDICATOR_COLOR = "#4A90E2";

export default function TestList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refresh?: string }>();

  // Session
  const user = useUserStore((state) => state.user);
  const userId = user?.userId;

  // State
  const [tests, setTests] = useState<
    TestResponse[] | HealthworkerTestResponse[]
  >([]);
  const [healthworkerTests, setHealthworkerTests] = useState<
    HealthworkerTestResponse[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Refs
  const didInitialLoadRef = useRef(false);

  // Utility Functions
  const formatDate = useCallback((date: string): string => {
    try {
      const fixed = date.includes(".")
        ? date.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}).*$/, "$1")
        : date;

      const normalized = fixed.endsWith("Z") ? fixed : `${fixed}Z`;
      return dayjs(normalized).format("DD MMM YYYY: hh:mm A");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  }, []);

  const navigateToTestResults = useCallback(
    async (item: TestResponse | HealthworkerTestResponse) => {
      const patientId = "patient_id" in item ? item.patient_id : null;
      if (!patientId) {
        console.warn("Cannot navigate: patient_id is missing");
        return;
      }
      const patientData = await fetchPatientById(patientId);
      console.log("Fetched patient data for navigation:", patientData);

      router.push({
        pathname: "/components/test-results",
        params: { 
          data: JSON.stringify(item),
          patientData: JSON.stringify(patientData?.patient) || null,
        },
      });
    },
    [router],
  );

  // API Functions
  const fetchTests = useCallback(
    async ({ pageNumber = 1, refresh = false }: FetchTestsParams = {}) => {
      if (!userId) {
        console.warn("Cannot fetch tests: No userId available");
        setLoading(false);
        return;
      }

      try {
        // Set appropriate loading state
        if (refresh) {
          setRefreshing(true);
        } else if (pageNumber === 1) {
          setLoading(true);
        } else {
          setIsMoreLoading(true);
        }
        let data = null;
        if (user?.userType === "healthworker") {
          data = await axiosClient.get<HealthworkerTestResponse[]>(
            "/healthworker/tests",
            {
              params: { hw_id: userId },
            },
          );
          setHealthworkerTests(data);
        } else {
          data = await axiosClient.get<TestResponse[]>("/users/tests", {
            params: { patient_id: userId },
          });
        }

        // Update tests list
        setTests((prev) =>
          refresh || pageNumber === 1 ? data : [...prev, ...data],
        );
        setHasMore(data?.length > 0);
      } catch (error) {
        console.error("Failed to fetch tests:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsMoreLoading(false);
      }
    },
    [userId],
  );

  const fetchPatientById = useCallback(async (patientId: number) => {
    try {
      const response = await axiosClient.get<IPatient>(
        `/healthworker/get-patient/${patientId}`,
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      return null;
    }
  }, []);

  // Event Handlers
  const handleRefresh = useCallback(() => {
    setHasMore(true);
    fetchTests({ pageNumber: 1, refresh: true });
  }, [fetchTests]);

  const handleLoadMore = useCallback(() => {
    if (!isMoreLoading && hasMore) {
      setIsMoreLoading(true);
      // Note: Actual pagination would require tracking page number
      // and calling fetchTests({ pageNumber: currentPage + 1 })
    }
  }, [isMoreLoading, hasMore]);

  const clearRefreshParam = useCallback(() => {
    setTimeout(() => {
      router.setParams({ refresh: undefined });
    }, 0);
  }, [router]);

  // Effects
  useFocusEffect(
    useCallback(() => {
      // Initial load on first mount
      if (!didInitialLoadRef.current) {
        fetchTests({ pageNumber: 1 });
        didInitialLoadRef.current = true;
        return;
      }

      // Refresh when navigating back with refresh param
      if (params.refresh === "true") {
        fetchTests({ pageNumber: 1, refresh: true });
        clearRefreshParam();
      }
    }, [params.refresh, fetchTests, clearRefreshParam]),
  );

  // Render Components
  const SkeletonCard = useCallback(
    () => (
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
    ),
    [],
  );

  const renderTestItem = useCallback(
    ({ item }: { item: HealthworkerTestResponse | TestResponse }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigateToTestResults(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={26} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.patientname}>
            {item.full_name} |{" "}
            {String(item.patient_uniqueid || item.patient_id).padStart(4, "0")}
          </Text>
          {/* <Text style={styles.testId}>PID: {String(item.patient_uniqueid || item.patient_id).padStart(4, "0")}</Text> */}
          <Text style={styles.dateTime}>Test ID: {item.test_id} |  {formatDate(item.created_timestamp || item.created_on)}</Text>
          {/* <Text style={styles.dateTime}>
            {formatDate(item.created_timestamp || item.created_on)}
          </Text> */}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    ),
    [formatDate, navigateToTestResults],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Tests Found</Text>
      </View>
    ),
    [],
  );

  const renderListFooter = useCallback(
    () =>
      isMoreLoading ? (
        <ActivityIndicator size="small" color={LOADING_INDICATOR_COLOR} />
      ) : null,
    [isMoreLoading],
  );

  const renderItemSeparator = useCallback(
    () => <View style={{ height: 0 }} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: TestResponse | HealthworkerTestResponse, index: number) =>
      `${item.id}-${index}`,
    [],
  );

  // Loading State
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Test List</Text>
        </View>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  // Main Render
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Test List</Text>
      </View>

      {/* Content */}
      <FlatList
        data={tests}
        keyExtractor={keyExtractor}
        renderItem={renderTestItem}
        alwaysBounceVertical={true}
        contentContainerStyle={
          tests.length === 0
            ? styles.emptyListContent // Full height for empty state
            : styles.listContent
        }
        ItemSeparatorComponent={renderItemSeparator}
        // onEndReached={handleLoadMore}
        // onEndReachedThreshold={END_REACHED_THRESHOLD}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        // ListFooterComponent={renderListFooter}
        // ListFooterComponentStyle={styles.listFooter}
        ListEmptyComponent={renderEmptyState} // Show empty state when no data
      />
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
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },

  item: {
    backgroundColor: "#fff",
    padding: 12,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ECF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  patientname: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
  },

  testId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  dateTime: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  skeletonContainer: {
    padding: 16,
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
  listContent: {
    paddingVertical: 0,
    paddingBottom: 0,
  },
  listFooter: {
    paddingBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 24,
    color: colors.white,
  },

  emptyListContent: {
    flexGrow: 1, // Makes the content take full height so empty state centers
    paddingVertical: 0,
    paddingBottom: 0,
  },
});
