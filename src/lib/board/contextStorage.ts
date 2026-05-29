import type { BusinessScores, CurrentPosition, VisionMap } from "./context";
import {
  defaultBusinessScores,
  defaultCurrentPosition,
  defaultVisionMap,
} from "./context";

const VISION_KEY = "positive-life-os-vision";
const POSITION_KEY = "positive-life-os-position";
const SCORES_KEY = "positive-life-os-scores";

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadVisionMap(): VisionMap {
  return safeLoad(VISION_KEY, defaultVisionMap);
}
export function saveVisionMap(v: VisionMap): void {
  safeSave(VISION_KEY, v);
}

export function loadCurrentPosition(): CurrentPosition {
  return safeLoad(POSITION_KEY, defaultCurrentPosition);
}
export function saveCurrentPosition(p: CurrentPosition): void {
  safeSave(POSITION_KEY, p);
}

export function loadBusinessScores(): BusinessScores {
  const saved = safeLoad<Partial<BusinessScores>>(SCORES_KEY, {});
  return { ...defaultBusinessScores, ...saved };
}
export function saveBusinessScores(s: BusinessScores): void {
  safeSave(SCORES_KEY, s);
}
