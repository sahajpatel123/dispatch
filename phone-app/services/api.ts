import axios from "axios";
import { useDispatchStore } from "../store/useDispatchStore";

const getClient = () => {
  const { serverUrl, secretToken } = useDispatchStore.getState();
  return axios.create({
    baseURL: serverUrl,
    headers: { 
      "x-dispatch-token": secretToken,
      "ngrok-skip-browser-warning": "69420" // Bypass Ngrok free tier warning page
    },
    timeout: 100000,
  });
};

export const sendCommand = async (command: string) => {
  try {
    const client = getClient();
    const res = await client.post("/command", { command });
    return res.data;
  } catch (e: any) {
    console.error("sendCommand error:", e.message, e.response?.data);
    throw e;
  }
};

export const getScreenshot = async () => {
  try {
    const client = getClient();
    const res = await client.get("/screenshot");
    return res.data;
  } catch (e: any) {
    console.error("getScreenshot error:", e.message);
    throw e;
  }
};

export const getState = async () => {
  const client = getClient();
  const res = await client.get("/state");
  return res.data;
};

export const getHistory = async () => {
  const client = getClient();
  const res = await client.get("/history");
  return res.data;
};

export const checkHealth = async (customUrl?: string, customToken?: string) => {
  try {
    const { serverUrl, secretToken } = useDispatchStore.getState();
    const url = customUrl || serverUrl;
    const token = customToken || secretToken;
    
    const client = axios.create({
      baseURL: url,
      headers: { 
        "x-dispatch-token": token,
        "ngrok-skip-browser-warning": "69420" // Bypass Ngrok free tier warning page
      },
      timeout: 100000,
    });
    const res = await client.get("/");
    return res.data;
  } catch (e: any) {
    console.error("checkHealth error:", e.message);
    throw e;
  }
};

export const executeRaw = async (actions: Array<{ action: string; params: object }>) => {
  const client = getClient();
  const res = await client.post("/execute-raw", { actions });
  return res.data;
};

export const teleport = async () => {
  const client = getClient();
  const res = await client.get("/teleport");
  return res.data;
};

export const ghostClick = async (x_percent: number, y_percent: number, type: string = "left") => {
  const client = getClient();
  const res = await client.post("/ghost-click", { x_percent, y_percent, type });
  return res.data;
};

