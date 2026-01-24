import { useSessionStore } from "@/app/stores/sessionStore";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import axiosClient from "./axiosClient";
import { clearAccessToken } from "./tokenStorage";

type JwtPayload = {
  sub: string;
  exp: number;
  iat: number;
  email?: string;
  roles?: string[];
};

export const decodeToken = (token: string): JwtPayload => {
  return jwtDecode<JwtPayload>(token);
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axiosClient.post("/users/login", {
      email,
      password,
    });
    const { access_token } = response;
    const user = decodeToken(access_token);
    useSessionStore.getState().setSession({
      userId: user.sub,
      userEmail: user.email || "",
      token: access_token,
    });
    // await setAccessToken(access_token);
    return response;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    // await axiosClient.post('/auth/logout');
    useSessionStore.getState().clearSession();
    await clearAccessToken();
    router.replace("/components/welcome");
  } catch (error) {
    throw error;
  }
};

export const validateUserEmail = async (email: string) => {
  const data = await axiosClient.get(
    `/users/validate-email/${encodeURIComponent(email)}`,
  );
  return data;
};

export const updateUserPassword = async (
  email: string,
  new_password: string,
) => {
  try {
    const response = await axiosClient.put("/users/update-password", {
      email,
      new_password,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (formData: {
  full_name: string;
  age: string;
  gender: string;
  email_id: string;
  mobile_no: string;
  password: string;
  role: string;
}) => {
  try {
    const response = await axiosClient.post("/users/create-user", formData);
    return response;
  } catch (error) {
    return {
      "message": (error as any)?.response?.data?.detail,
      "type": "error",
    };
  }
};
