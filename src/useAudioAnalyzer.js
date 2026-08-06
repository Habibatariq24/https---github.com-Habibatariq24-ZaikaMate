import { useEffect, useRef } from "react";

export function useAudioAnalyzer(audioEl) {
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (!audioEl) return;

    const audioCtx = new (window.AudioContext ||
      window.webkitAudioContext)();

    const source = audioCtx.createMediaElementSource(audioEl);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
  }, [audioEl]);

  function getVolume() {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return 0;

    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    const avg = sum / dataArray.length;

    // normalize (0 → 1)
    return avg / 255;
  }

  return { getVolume };
}