export interface ComputerSnapshot {
  sampledAt: string;
  cpuPercent: number | null;
  memoryUsedMb: number;
  memoryTotalMb: number;
  gpu: {
    name: string;
    loadPercent: number;
    temperatureC: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
  } | null;
  audio: {
    volume: number;
    muted: boolean;
    output: string;
    sessions: { id: string; name: string; volume: number; muted: boolean }[];
    microphoneMuted: boolean | null;
  } | null;
  capabilities: string[];
}
