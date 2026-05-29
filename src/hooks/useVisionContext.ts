"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultBusinessScores,
  defaultCurrentPosition,
  defaultVisionMap,
} from "@/lib/board/context";
import {
  loadBusinessScores,
  loadCurrentPosition,
  loadVisionMap,
  saveBusinessScores,
  saveCurrentPosition,
  saveVisionMap,
} from "@/lib/board/contextStorage";
import type { BusinessScores, CurrentPosition, VisionMap } from "@/lib/board/context";

export function useVisionContext() {
  const [vision, setVision] = useState<VisionMap>(defaultVisionMap);
  const [position, setPosition] = useState<CurrentPosition>(defaultCurrentPosition);
  const [scores, setScores] = useState<BusinessScores>(defaultBusinessScores);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setVision(loadVisionMap());
    setPosition(loadCurrentPosition());
    setScores(loadBusinessScores());
    setReady(true);
  }, []);

  const updateVision = useCallback((v: VisionMap) => {
    setVision(v);
    saveVisionMap(v);
  }, []);

  const updatePosition = useCallback((p: CurrentPosition) => {
    setPosition(p);
    saveCurrentPosition(p);
  }, []);

  const updateScores = useCallback((s: BusinessScores) => {
    setScores(s);
    saveBusinessScores(s);
  }, []);

  return { vision, position, scores, ready, updateVision, updatePosition, updateScores };
}
