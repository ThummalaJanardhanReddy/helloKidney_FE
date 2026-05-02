import dayjs from "dayjs";
import axiosClient from "./axiosClient";

export const savePatient = async (form: any) => {
  try {
    const response = await axiosClient.post("/healthworker/save-patient", form);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllPatients = async (
  hw_id: number,
  searchQuery: string,
  limit?: number,
) => {
  try {
    const response = await axiosClient.get("/healthworker/get-all-patients", {
      params: { hw_id, searchQuery, limit },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPatientsWithStatus = async (hw_id: number, limit?: number) => {
  try {
    const response = await axiosClient.get(
      "/healthworker/get-patients-with-status",
      {
        params: { hw_id, limit },
      },
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPatientsCount = async (hw_id: string) => {
  try {
    const response = await axiosClient.get(`/healthworker/get-patients-count`, {
      params: { hw_id },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getTodaysTestsCount = async (hw_id: string) => {
  try {
    const start = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const end = dayjs()
      .add(1, "day")
      .startOf("day")
      .format("YYYY-MM-DD HH:mm:ss");
    const response = await axiosClient.get(
      `/healthworker/get-todays-tests-count`,
      {
        params: { hw_id, start, end },
      },
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPatientById = async (id: string) => {
  try {
    const response = await axiosClient.get(`/healthworker/get-patient/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
