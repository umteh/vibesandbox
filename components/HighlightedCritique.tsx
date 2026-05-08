'use client';

import { useState } from 'react';

const SIGNAL_WORDS = [
  'nails', 'excellent', 'exceptional', 'outstanding', 'best', 'top-tier', 'seamless',
  'frictionless', 'crisp', 'sharp', 'core differentiator', 'irreplaceable', 'killer feature',
  'standout', 'genuinely', 'innovative', 'novel',
  'weak', 'lacks', 'generic', 'overcrowded', 'saturated', 'falls short', 'mediocre',
  'drops points', 'loses points', 'unfinished', 'afterthought', 'surface-level', 'cosmetic',
  'replaceable', 'wrapper', 'commodity', 'absent', 'brittle',
  'AI integration', 'differentiator', 'moat', 'proprietary', 'onboarding', 'novelty', 'polish',
];

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  return SIGNAL_WORDS.reduce((n, w) => n + (lower.includes(w.toLowerCase()) ? 1 : 0), 0);
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["']?(?:\s|$)|[^.!?]+$/g)?.map(s => s) ?? [text];
}

function getTldr(text: string): string {
  const sentences = splitSentences(text);
  // Use the highest-scoring sentence as TL;DR, fallback to first sentence
  let bestIdx = 0;
  let bestScore = -1;
  sentences.forEach((s, i) => {
    const score = scoreText(s);
    if (score > bestScore && s.trim().length > 40) {
      bestScore = score;
      bestIdx = i;
    }
  });
  return sentences[bestIdx]?.trim() ?? sentences[0]?.trim() ?? text;
}

interface Props {
  text: string;
}

export default function HighlightedCritique({ text }: Props) {
  const [expanded, setExpanded] = useState(false);
  const tldr = getTldr(text);

  return (
    <div>
      {expanded ? (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.85, marginBottom: 10 }}>
            {splitSentences(text).map((sentence, i) => {
              const isBest = sentence.trim() === tldr.trim();
              return isBest ? (
                <mark key={i} style={{
                  background: 'var(--blue-light)', color: 'var(--text)',
                  borderRadius: 4, padding: '1px 4px', fontWeight: 600,
                }}>{sentence}</mark>
              ) : (
                <span key={i}>{sentence}</span>
              );
            })}
          </p>
          <button onClick={() => setExpanded(false)} style={{
            fontSize: 12, color: 'var(--text3)', fontWeight: 500,
            textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
          }}>
            Show less
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.75, marginBottom: 10 }}>
            {tldr}
          </p>
          <button onClick={() => setExpanded(true)} style={{
            fontSize: 12, color: 'var(--blue)', fontWeight: 600,
            cursor: 'pointer', background: 'none', border: 'none', padding: 0,
          }}>
            Read full critique →
          </button>
        </>
      )}
    </div>
  );
}
