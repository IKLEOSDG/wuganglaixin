import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "雾港来信｜原创网页解谜游戏",
  description: "搜索档案、拼合线索，在潮水退去之前找到失踪的林岚。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
