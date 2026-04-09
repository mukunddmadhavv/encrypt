// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isConnected: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export interface ConnectRequest {
  phoneNumber: string; // e.g. "919876543210"
}

export interface PairingCodeResponse {
  code: string; // e.g. "ABCD-1234"
  status: "pending" | "connected" | "already_connected";
}

export interface WhatsAppStatus {
  isConnected: boolean;
  phone?: string;
}

// ─── Condition ────────────────────────────────────────────────────────────────

export interface Condition {
  id: string;
  userId: string;
  prompt: string;
  updatedAt: string;
}

export interface UpsertConditionRequest {
  prompt: string;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WSMessageType =
  | "connection_status"
  | "notification_triggered"
  | "error";

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
}

export interface ConnectionStatusPayload {
  status: "connected" | "disconnected" | "connecting";
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
