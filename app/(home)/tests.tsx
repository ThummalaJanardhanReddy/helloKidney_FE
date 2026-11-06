import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, RefreshControl, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";
import Text from "../components/Text";
import * as Animatable from "react-native-animatable";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axiosClient from "../../src/services/axiosClient";
import { colors, pageTitle } from "../shared/commonStyles";
import { KIDNEY_RESULT_SVG } from "../shared/resultSvgs";
import { useUserStore } from "../stores/userStore";
import { IPatient } from "@/src/utils/constants";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_MARGIN,
  useTabBarScrollHandler,
} from "@/src/navigation/tabBarVisibility";

const UACR_STAGE_META: Record<string, { label: string; color: string }> = {
  A1: { label: "Normal", color: "#1FA24A" },
  A2: { label: "Slightly Abnormal", color: "#F5A623" },
  A3: { label: "Abnormal", color: "#D51E16" },
};

// Stage derived from the observed uACR value itself (mg/g): <30 Normal,
// 30–300 Slightly Abnormal, >300 Abnormal.
const getUacrStage = (uacrText?: string): "A1" | "A2" | "A3" | undefined => {
  if (!uacrText) return undefined;
  const value = parseFloat(uacrText);
  if (Number.isNaN(value)) return undefined;
  if (value < 30) return "A1";
  if (value <= 300) return "A2";
  return "A3";
};

// Pulls just the uACR value out of a test row's output_metrics JSON,
// without surfacing microalbumin/creatinine — this list intentionally only
// shows the headline uACR result, not the full panel.
const getUacrValue = (outputMetrics?: string): string | undefined => {
  if (!outputMetrics) return undefined;
  try {
    return JSON.parse(outputMetrics)?.uacrInfo?.value;
  } catch {
    return undefined;
  }
};

const AnimatedFlatList = Animated.FlatList;

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
  age?: number;
  gender?: string;
};

type FetchTestsParams = {
  pageNumber?: number;
  refresh?: boolean;
};

// Constants
const SKELETON_CARD_COUNT = 6;
const END_REACHED_THRESHOLD = 0.3;
const LOADING_INDICATOR_COLOR = "#4A90E2";
const { width } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (width / 390));

const PAGE_SIZE = 10;

export default function TestList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const tabBarScrollHandler = useTabBarScrollHandler();

  // Session
  const user = useUserStore((state) => state.user);
  const userId = user?.userId;

  // State
  const [tests, setTests] = useState<
    TestResponse[] | HealthworkerTestResponse[]
  >([]);
  // const [healthworkerTests, setHealthworkerTests] = useState<
  //   HealthworkerTestResponse[]
  // >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Refs
  const didInitialLoadRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const currentPageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

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
      if (isNavigatingRef.current) return;

      const patientId = "patient_id" in item ? item.patient_id : null;
      if (!patientId) {
        console.warn("Cannot navigate: patient_id is missing");
        return;
      }

      isNavigatingRef.current = true;
      setIsNavigating(true);
      try {
        if (user?.userType === "healthworker") {
          const patientData = await fetchHWPatientById(patientId);
          console.log("Fetched patient data for navigation:", patientData);

          router.push({
            pathname: "/components/test-results",
            params: {
              data: JSON.stringify(item),
              patientData: JSON.stringify(patientData?.patient) || null,
            },
          });
        } else {
          const patientData = await fetchPatientById(patientId);
          console.log("Fetched patient data for navigation:", patientData);

          router.push({
            pathname: "/components/test-results",
            params: {
              data: JSON.stringify(item),
              patientData: JSON.stringify(patientData?.patient) || null,
            },
          });
        }
      } finally {
        isNavigatingRef.current = false;
        setIsNavigating(false);
      }
    },
    [router, user?.userType],
  );

  // API Functions
  // const fetchTests = useCallback(
  //   async ({ pageNumber = 1, refresh = false }: FetchTestsParams = {}) => {
  //     if (!userId) {
  //       console.warn("Cannot fetch tests: No userId available");
  //       setLoading(false);
  //       return;
  //     }

  //     try {
  //       // Set appropriate loading state
  //       if (refresh) {
  //         setRefreshing(true);
  //       } else if (pageNumber === 1) {
  //         setLoading(true);
  //       } else {
  //         setIsMoreLoading(true);
  //       }
  //       let data = null;
  //       if (user?.userType === "healthworker") {
  //         data = await axiosClient.get<HealthworkerTestResponse[]>(
  //           "/healthworker/tests",
  //           {
  //             params: { hw_id: userId },
  //           },
  //         );
  //         console.log("Fetched healthworker tests (/healthworker/tests):", data);
  //         // setHealthworkerTests(data);
  //       } else {
  //         data = await axiosClient.get<TestResponse[]>("/users/tests", {
  //           params: { patient_id: userId },
  //         });
  //         console.log("Fetched tests (/users/tests):", data);
  //       }

  //       // Update tests list
  //       setTests((prev) =>
  //         refresh || pageNumber === 1 ? data : [...prev, ...data],
  //       );
  //       setHasMore(data?.length > 0);
  //     } catch (error) {
  //       console.error("Failed to fetch tests:", error);
  //       setHasMore(false);
  //     } finally {
  //       setLoading(false);
  //       setRefreshing(false);
  //       setIsMoreLoading(false);
  //     }
  //   },
  //   [userId],
  // );

  const fetchTests = useCallback(
    async ({ pageNumber = 1, refresh = false }: FetchTestsParams = {}) => {
      if (!userId || isFetchingRef.current) return;

      // Prevent loading beyond the last page.
      if (pageNumber > 1 && !hasMoreRef.current) return;

      isFetchingRef.current = true;

      if (refresh) {
        setRefreshing(true);
      } else if (pageNumber === 1) {
        setLoading(true);
      } else {
        setIsMoreLoading(true);
      }

      try {
        let data: (TestResponse | HealthworkerTestResponse)[] = [];

        if (user?.userType === "healthworker") {
          data = await axiosClient.get<HealthworkerTestResponse[]>(
            "/healthworker/tests",
            {
              params: {
                hw_id: userId,
                page: pageNumber,
                limit: PAGE_SIZE,
              },
            },
          );
        } else {
          data = await axiosClient.get<TestResponse[]>("/users/tests", {
            params: {
              patient_id: userId,
              page: pageNumber,
              limit: PAGE_SIZE,
            },
          });
        }

        console.log(`Fetched tests (page ${pageNumber}):`, data);
        // Handle an unexpected empty response safely.
        if (!Array.isArray(data)) {
          throw new Error("Invalid tests API response");
        }

        // A short page indicates that there are no more records.
        const moreAvailable = data.length === PAGE_SIZE;

        hasMoreRef.current = moreAvailable;
        setHasMore(moreAvailable);

        if (pageNumber === 1 || refresh) {
          setTests(data);
          currentPageRef.current = 1;
        } else {
          setTests((previous) => {
            // Deduplicate records by their unique ID.
            const existingIds = new Set(previous.map((item) => item.id));
            const newItems = data.filter((item) => !existingIds.has(item.id));

            return [...previous, ...newItems];
          });

          currentPageRef.current = pageNumber;
        }
      } catch (error) {
        console.error("Failed to fetch tests:", error);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
        setIsMoreLoading(false);
      }
    },
    [userId, user?.userType],
  );

  const fetchHWPatientById = useCallback(async (patientId: number) => {
    try {
      const response = await axiosClient.get<IPatient>(
        `/healthworker/get-patient/${patientId}`,
      );
      console.log(
        `Fetched patient (/healthworker/get-patient/${patientId}):`,
        response,
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      return null;
    }
  }, []);

  const fetchPatientById = useCallback(async (patientId: number) => {
    try {
      const response = await axiosClient.get(`/users/get-patient`, {
        params: { patient_id: patientId },
      });
      console.log("Fetched patient (/users/get-patient):", response);
      return response;
    } catch (error) {
      console.log("Failed to fetch patient details: ", error);
      return null;
    }
  }, []);

  // Event Handlers
  // const handleRefresh = useCallback(() => {
  //   setHasMore(true);
  //   fetchTests({ pageNumber: 1, refresh: true });
  // }, [fetchTests]);

  const handleRefresh = useCallback(() => {
    if (isFetchingRef.current) return;

    hasMoreRef.current = true;
    setHasMore(true);

    fetchTests({ pageNumber: 1, refresh: true });
  }, [fetchTests]);

  const handleLoadMore = useCallback(() => {
    if (
      loading ||
      refreshing ||
      isMoreLoading ||
      isFetchingRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    fetchTests({
      pageNumber: currentPageRef.current + 1,
    });
  }, [fetchTests, loading, refreshing, isMoreLoading]);

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
    ({ item }: { item: HealthworkerTestResponse | TestResponse }) => {
      const uacrValue = getUacrValue(item.output_metrics);
      const stage = getUacrStage(uacrValue);
      const stageMeta = stage ? UACR_STAGE_META[stage] : undefined;
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigateToTestResults(item)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <SvgXml xml={KIDNEY_RESULT_SVG} width={36} height={49} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>uACR test results</Text>
              {item.full_name && (
                <Text style={styles.cardPatientName} numberOfLines={1}>
                  {item.full_name?.replaceAll(",", "")}
                  {(item.age || item.gender) && (
                    <Text style={styles.cardPatientMeta}>
                      , {item.age} years, {item.gender}
                    </Text>
                  )}
                </Text>
              )}
              <Text style={styles.cardDate}>
                {formatDate(item.created_timestamp || item.created_on)}
              </Text>
            </View>
          </View>

          <View style={styles.cardPrimaryBox}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={[styles.cardStageValue, { color: stageMeta?.color ?? colors.black }]}
              >
                {stage || "—"}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.cardStageLabel,
                  { flexShrink: 1, color: stageMeta?.color ?? "#1a1a1a" },
                ]}
              >
                {stageMeta?.label ?? ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardStatLabel}>uACR</Text>
              <Text style={styles.cardStatValue}>{uacrValue || "N/A"}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [formatDate, navigateToTestResults],
  );

  const renderHWTestItem = useCallback(
    ({ item }: { item: HealthworkerTestResponse | TestResponse }) => {
      const uacrValue = getUacrValue(item.output_metrics);
      const stage = getUacrStage(uacrValue);
      const stageMeta = stage ? UACR_STAGE_META[stage] : undefined;
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigateToTestResults(item)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <SvgXml xml={KIDNEY_RESULT_SVG} width={36} height={49} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>uACR test results</Text>
              {!!user?.userName && (
                <Text style={styles.cardPatientName} numberOfLines={1}>
                  {user.userName}
                </Text>
              )}
              <Text style={styles.cardDate}>
                {formatDate(item.created_timestamp || item.created_on)}
              </Text>
            </View>
          </View>

          <View style={styles.cardPrimaryBox}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={[styles.cardStageValue, { color: stageMeta?.color ?? colors.black }]}
              >
                {stage || "—"}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.cardStageLabel,
                  { flexShrink: 1, color: stageMeta?.color ?? "#1a1a1a" },
                ]}
              >
                {stageMeta?.label ?? ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardStatLabel}>uACR</Text>
              <Text style={styles.cardStatValue}>{uacrValue || "N/A"}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [formatDate, navigateToTestResults, user?.userName],
  );

  const renderEmptyState = useCallback(
    () => (
      // <View style={styles.emptyContainer}>
      //   <Text style={styles.emptyText}>No Tests Found</Text>
      // </View>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔎</Text>
        <Text style={styles.emptyText}>No tests available</Text>
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
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  // Main Render
  return (
    <View style={[styles.container]}>
      <StatusBar backgroundColor={colors.white} barStyle={"dark-content"} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerText}>Test List</Text>
      </View>

      {/* Content */}
      <AnimatedFlatList
        data={tests}
        keyExtractor={keyExtractor}
        renderItem={
          user?.userType === "healthworker" ? renderTestItem : renderHWTestItem
        }
        alwaysBounceVertical={true}
        contentContainerStyle={
          tests.length === 0
            ? styles.emptyListContent // Full height for empty state
            : styles.listContent
        }
        ItemSeparatorComponent={renderItemSeparator}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        onScroll={tabBarScrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={renderListFooter}
        // ListFooterComponentStyle={styles.listFooter}
        ListEmptyComponent={renderEmptyState} // Show empty state when no data
      />

      {isNavigating && (
        <View style={styles.navigatingOverlay}>
          <ActivityIndicator size="large" color={LOADING_INDICATOR_COLOR} />
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
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    ...pageTitle,
    color: "#000000",
  },

  card: {
    borderRadius: 16,
    backgroundColor: "#FAE3E4",
    padding: 16,
    borderColor: "#E3B3B3",
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    fontSize: rf(15),
    fontWeight: "600",
    color: colors.black,
  },
  cardPatientName: {
    fontSize: rf(12),
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 1,
  },
  cardPatientMeta: {
    fontSize: rf(12),
    fontWeight: "400",
    color: "#1a1a1a",
  },
  cardDate: {
    fontSize: rf(12),
    color: "#1a1a1a",
    marginTop: 2,
  },
  cardPrimaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  cardStageValue: {
    fontSize: rf(20),
    fontWeight: "700",
  },
  cardStageLabel: {
    fontSize: rf(11),
    fontWeight: "600",
    marginLeft: 6,
  },
  cardStatLabel: {
    fontSize: rf(11),
    color: "#1a1a1a",
    marginBottom: 4,
  },
  cardStatValue: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.black,
  },
  skeletonContainer: {
    paddingHorizontal: 22,
    paddingVertical: 16,
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
    paddingTop: 16,
    paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_MARGIN,
  },
  listFooter: {
    paddingBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // emptyText: {
  //   fontSize: 24,
  //   color: colors.black,
  // },

  emptyListContent: {
    flexGrow: 1, // Makes the content take full height so empty state centers
    paddingVertical: 0,
    paddingBottom: 0,
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: rf(15), color: "#9BADC4", fontWeight: "400" },
  navigatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
