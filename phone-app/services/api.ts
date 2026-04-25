import axios from "axios";
import { useDispatchStore } from "../store/useDispatchStore";

const getClient = () => {
  const { serverUrl, secretToken } = useDispatchStore.getState();
  return axios.create({
    baseURL: serverUrl,
    headers: { "x-dispatch-token": secretToken },
    timeout: 60000,
  });
};

export const sendCommand = async (command: string) => {
  const client = getClient();
  const res = await client.post("/command", { command });
  return res.data;
};

export const getScreenshot = async () => {
  const client = getClient();
  const res = await client.get("/screenshot");
  return res.data;
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

export const checkHealth = async () => {
  const client = getClient();
  const res = await client.get("/health");
  return res.data;
};

export const executeRaw = async (actions: Array<{ action: string; params: object }>) => {
  const client = getClient();
  const res = await client.post("/execute-raw", { actions });
  return res.data;
};
