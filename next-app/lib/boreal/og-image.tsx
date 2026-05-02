import { ImageResponse } from "next/og"

export const OG_IMAGE_SIZE = {
  height: 630,
  width: 1200,
} as const

export const OG_IMAGE_CONTENT_TYPE = "image/png"

type BorealOgImageOptions = {
  badge: string
  description: string
  eyebrow: string
  footer: string
  meta: readonly string[]
  title: string
}

export function createBorealOgImage({
  badge,
  description,
  eyebrow,
  footer,
  meta,
  title,
}: BorealOgImageOptions) {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background:
          "linear-gradient(135deg, #071311 0%, #0b1e1c 52%, #102135 100%)",
        color: "#f3fffd",
        display: "flex",
        height: "100%",
        padding: "40px",
        width: "100%",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(153, 240, 232, 0.18)",
          display: "flex",
          flex: 1,
          gap: "28px",
          padding: "36px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              alignItems: "center",
              color: "rgba(201, 255, 249, 0.88)",
              display: "flex",
              fontSize: 22,
              gap: "14px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #01fdff 0%, #62ffce 100%)",
                height: "12px",
                width: "72px",
              }}
            />
            <span>{eyebrow}</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              maxWidth: "760px",
            }}
          >
            <div
              style={{
                color: "#f8fffe",
                display: "flex",
                fontSize: 68,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.02,
              }}
            >
              {title}
            </div>
            <div
              style={{
                color: "rgba(233, 255, 252, 0.76)",
                display: "flex",
                fontSize: 28,
                lineHeight: 1.38,
                maxWidth: "720px",
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              color: "rgba(232, 255, 252, 0.72)",
              display: "flex",
              fontSize: 22,
              gap: "16px",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(90deg, rgba(1,253,255,0.95) 0%, rgba(98,255,206,0.95) 100%)",
                height: "2px",
                width: "96px",
              }}
            />
            <span>{footer}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            justifyContent: "space-between",
            width: "292px",
          }}
        >
          <div
            style={{
              background: "rgba(1, 253, 255, 0.12)",
              border: "1px solid rgba(1, 253, 255, 0.22)",
              color: "#d9fffb",
              display: "flex",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.18em",
              padding: "14px 16px",
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>

          <div
            style={{
              alignItems: "stretch",
              display: "flex",
              flex: 1,
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {meta.map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(7, 19, 17, 0.58)",
                  border: "1px solid rgba(180, 230, 224, 0.14)",
                  color: "rgba(237, 255, 252, 0.9)",
                  display: "flex",
                  flex: 1,
                  fontSize: 28,
                  lineHeight: 1.2,
                  padding: "16px 18px",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    OG_IMAGE_SIZE
  )
}
