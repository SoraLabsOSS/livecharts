export interface ShioriProps {
  background: string;
  brand: string;
  brandColor: string;
  logo: string;
  title: string;
  titleColor: string;
}

export const Shiori = ({
  title,
  background,
  titleColor,
  logo,
  brand,
  brandColor,
}: ShioriProps) => (
  <div
    style={{
      backgroundColor: background,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "60px",
      position: "relative",
      width: "100%",
    }}
  >
    <img
      alt=""
      height={96}
      src={logo}
      width={96}
      style={{
        borderRadius: "50%",
        objectFit: "contain",
      }}
    />

    <div
      style={{
        alignItems: "flex-start",
        bottom: "60px",
        display: "flex",
        gap: "48px",
        left: "60px",
        position: "absolute",
        right: "60px",
      }}
    >
      <div
        style={{
          color: brandColor,
          flexShrink: 0,
          fontSize: "64px",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
        }}
      >
        {brand}
      </div>

      <div
        style={{
          color: titleColor,
          flex: 1,
          fontSize: "64px",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.3,
          minWidth: 0,
        }}
      >
        {title}
      </div>
    </div>
  </div>
);
