import { router } from "expo-router";

export const handleLogout = () => {
  router.replace("/components/verify-details");
};
