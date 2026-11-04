import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card center">
      <h1 className="title small">Page not found</h1>
      <p className="lede">There is nothing at this address.</p>
      <Link href="/" className="btn primary">Back to home</Link>
    </div>
  );
}
