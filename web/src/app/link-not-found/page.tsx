import Link from 'next/link';

export const metadata = { title: 'Link not found' };

// Visitors are sent here when a short link does not exist or has expired.
export default function LinkNotFound() {
  return (
    <div className="card center">
      <h1 className="title small">Link not found</h1>
      <p className="lede">This short link does not exist, or it has expired.</p>
      <Link href="/" className="btn primary">Make a new one</Link>
    </div>
  );
}
