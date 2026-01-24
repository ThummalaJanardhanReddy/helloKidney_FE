import { useAuth } from "@/src/services/authContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? (
    <Redirect href="/(home)/home" />
  ) : (
    <Redirect href="/components/welcome" />
  );
}
