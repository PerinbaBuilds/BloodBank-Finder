import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#dc2626",
          color: "white",
          fontSize: 320,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        +
      </div>
    ),
    { ...size }
  );
}
