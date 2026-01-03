import { router } from "expo-router";
import axiosClient, { removeToken, saveToken } from "./axiosClient";


export const login = async (email: string, password: string) => {
  try {
    const response = await axiosClient.post('/users/login', {
      email,
      password,
    });
    const { access_token } = response;
    await saveToken(access_token);
    return response;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    // await axiosClient.post('/auth/logout');
    await removeToken();
    router.replace('/components/verify-details');
  } catch (error) {
    throw error;
  }
};