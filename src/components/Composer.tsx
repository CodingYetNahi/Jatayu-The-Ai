import { ArrowUp, Square } from 'lucide-react';
import { useEffect, useRef } from 'react';
export function Composer({ value, setValue, onSend, busy, onStop }: { value: string; setValue: (v: string) => void; onSend: () => void; busy: boolean; onStop: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = `${Math.min(ref.current.scrollHeight, 180)}px`; } }, [value]);
  return <div className="composer-wrap"><div className="composer"><textarea ref={ref} rows={1} maxLength={16000} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }} placeholder="Message Jatayu…" aria-label="Message Jatayu" disabled={busy}/>{busy ? <button className="send stop" onClick={onStop} aria-label="Stop generation"><Square fill="currentColor"/></button> : <button className="send" onClick={onSend} disabled={!value.trim()} aria-label="Send message"><ArrowUp/></button>}</div><p>Jatayu can make mistakes. Verify important information.</p></div>;
}
