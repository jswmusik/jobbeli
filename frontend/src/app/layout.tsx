// Root layout - actual layout is in [locale]/layout.tsx
// This file is required by Next.js but we delegate to the locale layout

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
