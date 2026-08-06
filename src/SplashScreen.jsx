import { useEffect } from "react";
import "./styles.css";

export default function SplashScreen() {
  const letters = "ZAIKAMATE".split("");

  useEffect(() => {
    const audio = new Audio("/sound.wav");
    audio.playbackRate = 0.6;

    // 🔥 sound start when animation starts (first frame delay)
    const timer = setTimeout(() => {
      audio.play().catch(() => {});
    }, 100); // small delay to sync with animation start

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container splash-container">
      <div className="row">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="letter"
            style={{
              animationDelay: `${i * 0.15}s`,
              display: "inline-block",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}