import { useCallback, useRef, useState, useEffect } from "react";

export function useSpeech() {
  const [enabled, setEnabled] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        voiceRef.current =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("female") ||
                v.name.includes("Google US English"))
          ) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, priority?: string, assignee?: string) => {
      if (!enabled) return;
      speechSynthesis.cancel();

      const prefix =
        priority === "critical"
          ? `Critical task${assignee ? ` for ${assignee}` : ""}: `
          : priority === "medium"
          ? `Priority task${assignee ? ` for ${assignee}` : ""}: `
          : "";

      const utterance = new SpeechSynthesisUtterance(prefix + text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  return { speak, enabled, setEnabled, voicesLoaded };
}
