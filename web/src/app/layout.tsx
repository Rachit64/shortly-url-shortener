import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import '@fontsource-variable/big-shoulders-display/wght';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './globals.css';
import { AccessibilityMenu } from '@/components/AccessibilityMenu';

// Applies saved accessibility settings before first paint, so the page never flashes at the default size.
const a11yScript = `try{var p=JSON.parse(localStorage.getItem('shortener.a11y')||'{}'),r=document.documentElement;r.dataset.text=p.text||'normal';r.dataset.contrast=p.contrast?'high':'normal';r.dataset.font=p.readable?'readable':'default'}catch(e){}`;

export const metadata: Metadata = {
  title: { default: 'URL Shortener', template: '%s · URL Shortener' },
  description: 'Shorten a link, get a QR code, and see who clicks it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="a11y-prefs" strategy="beforeInteractive">{a11yScript}</Script>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">Shortly</Link>
            <AccessibilityMenu />
          </div>
        </header>
        <main id="main" className="container">{children}</main>
      </body>
    </html>
  );
}
