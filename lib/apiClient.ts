import { io, Socket } from 'socket.io-client';

// ============================================
// DOCKER-OPTIMIZED CONFIGURATION
// ============================================
// Uses relative URLs instead of hardcoded IPs
// nginx reverse proxy handles routing:
//   - /api/* -> backend:3001
//   - /socket.io/* -> backend:3001 (WebSocket)
// This allows the image to work on ANY device without rebuilding
// ============================================

// Use relative URLs (proxied by nginx)
// In development: falls back to localhost:3001
// In production (Docker): uses same-origin (nginx proxy)
const IS_BROWSER = typeof window !== 'undefined';
const API_BASE_URL = IS_BROWSER ? '' : 'http://localhost:3001';
const WS_URL = IS_BROWSER ? '' : 'http://localhost:3001';

// WebSocket singleton
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Connect to same origin (nginx will proxy to backend)
    socket = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
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
  return data;
}

export async function saveFile(
  path: string,
  content: string,
  mtime: number | null,
  force = false
): Promise<SaveFileResponse> {
  // No timeout - let large files take as long as they need
  // Backend has 300s (5 min) timeout for validation of 100k+ line configs
  const res = await fetch(`${API_BASE_URL}/api/files/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content, mtime, force }),
  });

  if (!res.ok) {
    let errorMessage = `Failed to save file: ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = `Failed to save file: ${errorData.error}`;
      }
    } catch {
      // If response is not JSON, try text
      try {
        const errorText = await res.text();
        if (errorText) {
          errorMessage = `Failed to save file: ${res.status} - ${errorText}`;
        }
      } catch {
        // Keep original error message
      }
    }
    throw new Error(errorMessage);
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

// Dictionary Management
export async function listDictionaryFiles(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/files`);
  const data = await res.json();
  return data.files;
}

export async function getDictionaryFileContent(fileName: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/${fileName}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get dictionary file');
  }
  const data = await res.json();
  return data.content;
}

export async function createDictionaryFile(fileName: string): Promise<{ success: boolean; filePath: string }> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create dictionary file');
  }
  return await res.json();
}

export async function deleteDictionaryFile(fileName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/dictionary/${fileName}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete dictionary file');
  }
}
