export interface TuyaSnapshot {
  online: boolean;
  power: boolean | null;
  humidity: number | null;
  observedAt: string;
  measurementTime: null;
  canPower: boolean;
  countdownOptions: string[];
  countdownSetting: string | null;
  countdownLeft: number | null;
}
