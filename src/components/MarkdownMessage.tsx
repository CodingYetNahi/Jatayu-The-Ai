import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { useState, type ReactNode } from 'react';

function Code({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false); const code = String(children).replace(/\n$/, ''); const block = Boolean(className?.startsWith('language-'));
  if (!block) return <code className={className}>{children}</code>;
  const language = className?.replace('language-', '') ?? 'code';
  return <div className="code-block"><div className="code-head"><span>{language}</span><button onClick={() => { void navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label="Copy code">{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}</button></div><pre><code className={className}>{children}</code></pre></div>;
}
export function MarkdownMessage({ content }: { content: string }) { return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ code: Code, a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>{content}</ReactMarkdown></div> }
