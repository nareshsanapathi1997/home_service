export const config = {
  app: {
    name: process.env.APP_NAME || "FixNear",
    contactEmail: process.env.APP_CONTACT_EMAIL || "info@fixnear.in",
    contactPhone: process.env.APP_CONTACT_PHONE || "+91-XXXX-XXXXXX",
    theme: {
      primary: process.env.APP_THEME_PRIMARY || "#134E4A",
      accent: process.env.APP_THEME_ACCENT || "#C4A052",
      secondary: process.env.APP_THEME_SECONDARY || "#1A2332",
    },
  },
  commission: {
    default: parseFloat(process.env.APP_COMMISSION_DEFAULT || "0.12"),
  },
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  timezone: "Asia/Kolkata",
} as const;
