import axios from "axios";
import { getToken } from "@/lib/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type UserProfile = {
  id: number;
  email: string;
  full_name?: string | null;
};

export type Contract = {
  id: number;
  filename: string;
  file_path: string;
  created_at: string;
};

export type RiskItem = {
  type: string;
  subcategory?: string;
  severity: "Low" | "Medium" | "High";
  confidence: number;
  explanation: string;
  clause_excerpt: string;
};

export type RiskAnalysis = {
  overall_risk_level: "Low" | "Medium" | "High";
  risk_score: number;
  risk_distribution: Record<string, number>;
  total_risks: number;
  confidence: number;
  risks: RiskItem[];
};

export function extractApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
          return item.msg;
        }

        return null;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  return fallback;
}
