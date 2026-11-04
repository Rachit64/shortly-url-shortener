'use client';

import { useEffect, useRef, useState } from 'react';

interface Prefs {
  text: 'normal' | 'large' | 'xlarge';
  contrast: boolean;
  readable: boolean;
}

const KEY = 'shortener.a11y';
const DEFAULTS: Prefs = { text: 'normal', contrast: false, readable: false };

// Preferences are applied as data attributes on <html>; globals.css reacts to them.
function apply(p: Prefs) {
  const root = document.documentElement;
  root.dataset.text = p.text;
  root.dataset.contrast = p.contrast ? 'high' : 'normal';
  root.dataset.font = p.readable ? 'readable' : 'default';
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setPrefs({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') });
    } catch {
      /* no saved preferences */
    }
  }, []);

  function update(next: Prefs) {
    setPrefs(next);
    apply(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: applies for this visit only */
    }
  }

  // Escape or a click outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const sizes: [Prefs['text'], string, string][] = [['normal', 'A', 'Normal text size'], ['large', 'A+', 'Large text size'], ['xlarge', 'A++', 'Extra large text size']];

  return (
    <div className="a11y" ref={box}>
      <button type="button" className="btn btn-small a11y-btn" aria-expanded={open} aria-controls="a11y-panel" onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M7 10.5l5 1 5-1M12 11.5v4M9.5 19l2.5-3.5 2.5 3.5" />
        </svg>
        Accessibility
      </button>

      {open && (
        <div id="a11y-panel" className="a11y-panel" role="group" aria-label="Accessibility settings">
          <h2>Accessibility</h2>
          <fieldset>
            <legend>Text size</legend>
            <div className="seg">
              {sizes.map(([value, label, name]) => (
                <button key={value} type="button" className="btn" aria-pressed={prefs.text === value} aria-label={name} onClick={() => update({ ...prefs, text: value })}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="switch">
            High contrast
            <input type="checkbox" role="switch" checked={prefs.contrast} onChange={(e) => update({ ...prefs, contrast: e.target.checked })} />
          </label>
          <label className="switch">
            Readable font (for dyslexia and low vision)
            <input type="checkbox" role="switch" checked={prefs.readable} onChange={(e) => update({ ...prefs, readable: e.target.checked })} />
          </label>
          <button type="button" className="btn btn-small btn-ghost" onClick={() => update(DEFAULTS)}>Reset to defaults</button>
        </div>
      )}
    </div>
  );
}
