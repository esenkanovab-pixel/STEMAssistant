import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'STEM Assistant', description: 'Multilingual STEM classroom workspace'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="ru"><body>{children}</body></html>;}
