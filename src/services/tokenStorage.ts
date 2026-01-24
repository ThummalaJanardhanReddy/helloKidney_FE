// app/shared/services/tokenStorage.ts
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

type TokenData = {
  accessToken: string;
  email: string;
};
export async function getAccessToken() {
  const token = await SecureStore.getItemAsync("accessToken");
  // if (token) {
  //   return JSON.parse(token) as TokenData;
  // }
  return token;
}

export async function setAccessToken(token: TokenData) {
  return SecureStore.setItemAsync("accessToken", JSON.stringify(token));
}

export async function clearAccessToken() {
  return SecureStore.deleteItemAsync("accessToken");
}

export async function getUserEmail() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    const parsedToken = jwtDecode(token);
    const { email } = parsedToken as any;
    return email;
  }
  return null;
}
export async function getUserId() {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    const parsedToken = jwtDecode(token);
    const { user_id } = parsedToken as any;
    return user_id;
  }
  return null;
}
