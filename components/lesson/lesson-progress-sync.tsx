"use client";

import { useEffect, useRef } from "react";
import { saveProgress } from "@/lib/progress-client";
import { youtubePlayerElementId } from "@/lib/progress";

const POSITION_INTERVAL_MS = 15_000;

type YTPlayer = {
  getCurrentTime: () => number;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    id: string,
    options: {
      events?: {
        onReady?: (event: { target: YTPlayer }) => void;
        onStateChange?: (event: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YTNamespace> | null = null;

function loadYoutubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    } else if (window.YT?.Player) {
      resolve(window.YT);
    }
  });

  return youtubeApiPromise;
}

type LessonProgressSyncProps = {
  lessonId: string;
  trackYoutube: boolean;
};

/**
 * Records last-viewed lesson on mount, YouTube currentTime (debounced), and
 * marks complete when the video ends. Next-lesson complete is handled by LessonNav.
 */
export function LessonProgressSync({
  lessonId,
  trackYoutube,
}: LessonProgressSyncProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    void saveProgress({ lessonId });
  }, [lessonId]);

  useEffect(() => {
    if (!trackYoutube) return;

    let cancelled = false;
    const iframeId = youtubePlayerElementId(lessonId);

    function clearTick() {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function sendPosition(player: YTPlayer, force = false) {
      const seconds = Math.floor(player.getCurrentTime() || 0);
      if (!force && seconds === lastSentRef.current) return;
      lastSentRef.current = seconds;
      void saveProgress({ lessonId, positionSeconds: Math.max(0, seconds) });
    }

    function startTick(player: YTPlayer) {
      clearTick();
      intervalRef.current = window.setInterval(() => {
        sendPosition(player);
      }, POSITION_INTERVAL_MS);
    }

    void loadYoutubeApi().then((YT) => {
      if (cancelled || !document.getElementById(iframeId)) return;

      const player = new YT.Player(iframeId, {
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
          },
          onStateChange: (event) => {
            const { PLAYING, PAUSED, ENDED } = YT.PlayerState;
            if (event.data === PLAYING) {
              startTick(event.target);
            } else if (event.data === PAUSED) {
              clearTick();
              sendPosition(event.target, true);
            } else if (event.data === ENDED) {
              clearTick();
              sendPosition(event.target, true);
              void saveProgress({
                lessonId,
                completed: true,
                positionSeconds: Math.max(0, Math.floor(event.target.getCurrentTime() || 0)),
              });
            }
          },
        },
      });
      playerRef.current = player;
    });

    function onPageHide() {
      if (playerRef.current) sendPosition(playerRef.current, true);
    }

    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      clearTick();
      window.removeEventListener("pagehide", onPageHide);
      try {
        playerRef.current?.destroy();
      } catch {
        // Player may already be gone with the iframe.
      }
      playerRef.current = null;
    };
  }, [lessonId, trackYoutube]);

  return null;
}
