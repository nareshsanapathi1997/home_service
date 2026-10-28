import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/technicians"],
      disallow: ["/customer", "/technician/", "/admin", "/api", "/notifications"],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}
