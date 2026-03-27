import { useCallback, useRef, useEffect, useState } from "react";

export function useSpeech() {
  const enabled = useRef(true);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    enabled.current = val;
    if (!val) {
      speechSynthesis.cancel(); // only cancel when turning OFF
    }
  }, []);

  // 🔥 Female voice selection
  const getFemaleVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();

    if (!voices.length) return null;

    const female =
      voices.find(v =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("google us english")
      ) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    return female;
  }, []);

  // 🔊 QUEUE-BASED SPEAK FUNCTION (FIXED)
  const speak = useCallback(
    (
      text: string,
      priority: "critical" | "medium" | "normal",
      assignee?: string,
      customMessage?: string,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      if (!enabled.current) return;

      const priorityText =
        priority === "critical"
          ? "Critical task"
          : priority === "medium"
          ? "Important task"
          : "Task";

      const assigneeText = assignee
        ? `assigned to ${assignee}`
        : "assigned to team";

      const message = customMessage || `${priorityText}. ${assigneeText}. ${text}`;

      const utterance = new SpeechSynthesisUtterance(message);

      if (onStart) utterance.onstart = onStart;
      if (onEnd) utterance.onend = onEnd;

      const voice = getFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      // ❗ DO NOT cancel → this allows queue
      speechSynthesis.speak(utterance);
    },
    [getFemaleVoice]
  );
  const playNotificationSound = useCallback(() => {
    if (!enabled.current) return;
    const audio = new Audio('/notification.mpeg');
    audio.play().catch(e => console.error("Could not play notification sound:", e));
  }, []);

  return { speak, setEnabled, voicesLoaded, playNotificationSound };
}