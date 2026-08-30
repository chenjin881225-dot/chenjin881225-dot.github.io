import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "CHEN — Creative Work Index",
    description: "陈琎 2011—2026 创意作品索引：科技 AI 产品、海外科技品牌、原创 IP 资产、品牌整合创新与视觉进化。",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "CHEN — Creative Work Index",
      description: "以五个能力章节与工作阶段组织的紧凑型动态作品导航。",
      type: "website",
      images: [{ url: `${origin}/og-reference.png`, width: 1731, height: 909, alt: "CHEN — Enter Portfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CHEN — Creative Work Index",
      description: "以五个能力章节与工作阶段组织的紧凑型动态作品导航。",
      images: [`${origin}/og-reference.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
