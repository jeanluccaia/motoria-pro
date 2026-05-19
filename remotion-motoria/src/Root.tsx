import React from "react";
import { Composition } from "remotion";
import { MotoriaReel } from "./MotoriaReel";
import { MotoriaAdV2 } from "./MotoriaAdV2";
import { MotoriaPro } from "./Video";
import { MotoriaProV3 } from "./MotoriaProV3";

export const Root: React.FC = () => {
  return (
    <>
      {/* MotoriaProV3 — 900 frames (30s) — 1080×1920 portrait — nova versão */}
      <Composition
        id="MotoriaProV3"
        component={MotoriaProV3}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* MotoriaPro — 750 frames (25s) — 1080×1920 portrait */}
      <Composition
        id="MotoriaPro"
        component={MotoriaPro}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* V2 — UI real animada (sem arquivos externos) */}
      <Composition
        id="MotoriaAdV2"
        component={MotoriaAdV2}
        durationInFrames={960}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* V1 — requer v1.mp4, v2.mp4, v3.mp4 na pasta public/ */}
      <Composition
        id="MotoriaReel"
        component={MotoriaReel}
        durationInFrames={960}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
