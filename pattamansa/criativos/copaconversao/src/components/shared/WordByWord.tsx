import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface Props {
  words: string[];
  framesPerWord?: number;
  style?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
  activeColor?: string;
  delay?: number;
}

// Anima palavra a palavra com spring pop
export const WordByWord: React.FC<Props> = ({
  words,
  framesPerWord = 12,
  style,
  wordStyle,
  activeColor,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px", ...style }}>
      {words.map((word, i) => {
        const wordFrame = f - i * framesPerWord;
        const pop = spring({ frame: wordFrame, fps, config: { damping: 18, stiffness: 200, mass: 0.6 } });
        const scale = interpolate(pop, [0, 1], [0.65, 1]);
        const opacity = interpolate(pop, [0, 1], [0, 1]);
        const isActive = activeColor && i === words.length - 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `scale(${scale})`,
              transformOrigin: "center bottom",
              opacity,
              color: isActive ? activeColor : undefined,
              ...wordStyle,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
