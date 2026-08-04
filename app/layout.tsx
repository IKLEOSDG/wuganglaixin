import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "雾港来信｜网页调查游戏", description: "调查母亲在雾港岛的失踪，从正常生活记录中找出无法对上的部分。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
