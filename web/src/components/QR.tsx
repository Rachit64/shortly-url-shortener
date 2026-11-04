'use client';

import qrcode from 'qrcode-generator';
import { useMemo, useRef } from 'react';

const DARK = '#17150f';
const LIGHT = "#ffffff";
const QUIET = 2;

/** QR code drawn as one SVG path, dark on light so every scanner can read it. */
export function QR({ text, size = 168, filename = 'qr-code' }: { text: string; size?: number; filename?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { path, modules } = useMemo(() => {
    const qr = qrcode(0, 'Q');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!qr.isDark(r, c)) { c++; continue; }
        const start = c;
        while (c < n && qr.isDark(r, c)) c++;
        d += `M${start + QUIET} ${r + QUIET}h${c - start}v1h-${c - start}z`;
      }
    }
    return { path: d, modules: n + QUIET * 2 };
  }, [text]);

  function serialise() {
    const svg = svgRef.current!.cloneNode(true) as SVGSVGElement;
    svg.removeAttribute('class');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '1024');
    svg.setAttribute('height', '1024');
    return new XMLSerializer().serializeToString(svg);
  }

  function save(blob: Blob, ext: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPng() {
    const url = URL.createObjectURL(new Blob([serialise()], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => b && save(b, 'png'));
    };
    img.src = url;
  }

  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${modules} ${modules}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`QR code for ${text}`}
        style={{ display: 'block' }}
      >
        <rect width={modules} height={modules} fill={LIGHT} />
        <path d={path} fill={DARK} />
      </svg>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => save(new Blob([serialise()], { type: 'image/svg+xml' }), 'svg')}>SVG</button>
        <button type="button" className="btn btn-small btn-ghost" onClick={downloadPng}>PNG</button>
      </div>
    </div>
  );
}
