import { Check, Copy, Pencil, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { ChatMessage } from '../types/chat';
import { MarkdownMessage } from './MarkdownMessage';
export function MessageItem({ message, isLast, busy, onEdit, onRegenerate }: { message: ChatMessage; isLast: boolean; busy: boolean; onEdit: (message: ChatMessage) => void; onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false); const assistant = message.role === 'assistant';
  return <article className={`message ${message.role}`} aria-label={`${message.role} message`}><div className="message-label">{assistant ? 'Jatayu' : 'You'}</div><div className="message-body">{assistant ? <MarkdownMessage content={message.content}/> : <p>{message.content}</p>}</div><div className="message-actions">{assistant ? <><button aria-label="Copy response" onClick={() => { void navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check/> : <Copy/>}<span>{copied ? 'Copied' : 'Copy'}</span></button>{isLast && <button disabled={busy} onClick={onRegenerate}><RefreshCw/><span>Regenerate</span></button>}</> : <button disabled={busy} onClick={() => onEdit(message)}><Pencil/><span>Edit & resend</span></button>}</div></article>;
}
