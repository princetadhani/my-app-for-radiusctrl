import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

console.log('🔧 API Configuration:', {
  API_BASE_URL,
  WS_URL,
  env: process.env.NEXT_PUBLIC_API_URL,
});

// WebSocket singleton
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  return socket;
}

// Types
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  icon?: string;
  children?: FileNode[];
}

export interface FileContentResponse {
  content: string;
  mtime: number;
  readOnly?: boolean;
}

export interface SaveFileResponse {
  status: 'success' | 'validation_failed';
  mtime?: number;
  message?: string;
  validationOutput?: string;
  validationError?: string;
}

export interface CreateUserResponse {
  status: 'success' | 'exists' | 'validation_failed';
  message: string;
  validationOutput?: string;
  validationError?: string;
}

export interface RadiusStatus {
  status: 'running' | 'stopped';
  active: boolean;
  uptime?: number;
  pid?: number;
  memory?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  message: string;
}

export interface CoaRequest {
  type: 'coa' | 'disconnect';
  nasIp: string;
  nasSecret: string;
  attributes: string;
  fileName?: string;
}

export interface ValidationResult {
  success: boolean;
  output: string;
  error?: string;
}

// API Functions

export async function getFileTree(): Promise<FileNode[]> {
  const res = await fetch(`${API_BASE_URL}/api/files/tree`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file tree: ${res.status}`);
  }
  const data = await res.json();
  return data.tree;
}

export async function getFileContent(path: string): Promise<FileContentResponse> {
  const res = await fetch(`${API_BASE_URL}/api/files/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch file content: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log('getFileContent response:', data);
  return data;
}

export async function saveFile(
  path: string,
  content: string,
  mtime: number | null,
  force = false
): Promise<SaveFileResponse> {
  const res = await fetch(`${API_BASE_URL}/api/files/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, mtime, force }),
  });
  if (!res.ok) {
    throw new Error(`Failed to save file: ${res.status}`);
  }
  return await res.json();
}

export async function validateConfiguration(): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE_URL}/api/files/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to validate configuration: ${res.status}`);
  }
  return await res.json();
}

export async function getRadiusStatus(): Promise<RadiusStatus> {
  const res = await fetch(`${API_BASE_URL}/api/service/status`);
  if (!res.ok) {
    throw new Error(`Failed to get service status: ${res.status}`);
  }
  return await res.json();
}

export async function reloadService(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/service/reload`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to reload service: ${res.status}`);
  }
  return await res.json();
}

export async function restartService(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/service/restart`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Failed to restart service: ${res.status}`);
  }
  return await res.json();
}

export async function readLogs(lines?: number): Promise<LogEntry[]> {
  const url = lines
    ? `${API_BASE_URL}/api/logs/read?lines=${lines}`
    : `${API_BASE_URL}/api/logs/read`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to read logs: ${res.status}`);
  }
  const data = await res.json();
  return data.logs;
}

export async function getCoaFileTree(): Promise<FileNode[]> {
  const res = await fetch(`${API_BASE_URL}/api/coa/tree`);
  if (!res.ok) {
    throw new Error(`Failed to fetch COA file tree: ${res.status}`);
  }
  const data = await res.json();
  return data.tree;
}

export async function executeCoaCommand(request: CoaRequest): Promise<{ success: boolean; output: string; fileName?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/coa/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return await res.json();
}

export async function listCoaFiles(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/coa/files`);
  const data = await res.json();
  return data.files;
}

export async function getCoaFileContent(fileName: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/coa/files/${fileName}`);
  const data = await res.json();
  return data.content;
}

export async function createCoaFile(fileName: string, attributes: string): Promise<{ success: boolean; filePath: string }> {
  const res = await fetch(`${API_BASE_URL}/api/coa/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, attributes }),
  });
  return await res.json();
}

// User Management
export async function createNewUser(filename: string): Promise<CreateUserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/files/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  return await res.json();
}

export async function deleteCoaFile(fileName: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/coa/files/${fileName}`, {
    method: 'DELETE',
  });
}
