import { Shortener } from '@/components/Shortener';

export default function Home() {
  return (
    <>
      <h1 className="title">URL Shortener</h1>
      <p className="lede">Paste a long link, get a short one with a QR code. No account needed.</p>
      <Shortener />
    </>
  );
}
