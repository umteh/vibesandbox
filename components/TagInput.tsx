'use client';

import { useState, KeyboardEvent } from 'react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
}

export default function TagInput({ tags, onChange, placeholder = 'Type and press Enter', suggestions = [], maxTags = 10 }: Props) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);

  function add(value: string) {
    const v = value.trim();
    if (!v || tags.includes(v) || tags.length >= maxTags) return;
    onChange([...tags, v]);
    setInput('');
  }

  function remove(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
  }

  const filteredSuggestions = suggestions.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s) && input.length > 0
  ).slice(0, 6);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
        border: `1px solid ${focused ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: 8, background: 'var(--bg)', minHeight: 42,
        cursor: 'text', transition: 'border-color 0.15s',
      }} onClick={() => document.getElementById('tag-input-field')?.focus()}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4, background: 'var(--blue-light)',
            border: '1px solid var(--blue)', fontSize: 12, fontWeight: 500, color: 'var(--blue)',
          }}>
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remove(tag); }}
              style={{ fontSize: 14, lineHeight: 1, color: 'var(--blue)', opacity: 0.6 }}>×</button>
          </span>
        ))}
        <input
          id="tag-input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) add(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, minWidth: 120, flex: 1 }}
        />
      </div>

      {filteredSuggestions.length > 0 && focused && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-md)', marginTop: 4, overflow: 'hidden',
        }}>
          {filteredSuggestions.map(s => (
            <button key={s} type="button"
              onMouseDown={e => { e.preventDefault(); add(s); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 13, color: 'var(--text2)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
