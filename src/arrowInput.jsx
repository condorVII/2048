import { useEffect, useRef } from "react";

export function useArrowInput(onInput) {
  const buffer = useRef([]);
  const lastProcessed = useRef(0);
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    function handleKeyDown(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!pressedKeys.current.has(e.key)) {
          pressedKeys.current.add(e.key);
          const lastInBuffer = buffer.current[buffer.current.length - 1];
          if (!lastInBuffer || lastInBuffer.key !== e.key) {
            buffer.current.push({ key: e.key, time: Date.now() });
          }
        }
      }
    }

    function handleKeyUp(e) {
      if (pressedKeys.current.has(e.key)) {
        pressedKeys.current.delete(e.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const interval = setInterval(() => {
      const now = Date.now();

      buffer.current = buffer.current.filter(
        (item) => now - item.time <= 600 // czas buforu
      );

      if (now - lastProcessed.current >= 300 && buffer.current.length > 0) { // przerwa między inputami
        const input = buffer.current.shift(); // weź pierwszy z kolejki
        onInput(input.key);
        lastProcessed.current = now;
      }
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(interval);
    };
  }, [onInput]);
}