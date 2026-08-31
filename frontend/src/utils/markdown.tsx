import React, { useState } from 'react';
import { Copy, Check, Sparkles, Terminal } from 'lucide-react';

interface MarkdownProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split content by fenced code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose-chat text-[14.5px] leading-relaxed text-zinc-200 break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const language = match ? match[1] || 'text' : 'text';
          const codeContent = match ? match[2] : part.slice(3, -3);
          return (
            <CodeBlockSnippet
              key={index}
              language={language}
              code={codeContent.replace(/^\n+|\n+$/g, '')}
            />
          );
        }

        return <InlineMarkdownText key={index} text={part} />;
      })}
    </div>
  );
};

const CodeBlockSnippet: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Terminal size={13} className="text-zinc-500" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-zinc-200 bg-zinc-950 leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const InlineMarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h3 key={lIdx}>{renderInlineElements(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={lIdx}>{renderInlineElements(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={lIdx}>{renderInlineElements(trimmed.slice(2))}</h1>;
        }

        // Unordered List
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <ul key={lIdx}>
              <li>{renderInlineElements(trimmed.slice(2))}</li>
            </ul>
          );
        }

        // Ordered List
        const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (olMatch) {
          return (
            <ol key={lIdx} start={parseInt(olMatch[1], 10)}>
              <li>{renderInlineElements(olMatch[2])}</li>
            </ol>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return <blockquote key={lIdx}>{renderInlineElements(trimmed.slice(2))}</blockquote>;
        }

        // Standard Paragraph or empty line
        if (!line.trim()) {
          return <div key={lIdx} className="h-1.5" />;
        }

        return <p key={lIdx}>{renderInlineElements(line)}</p>;
      })}
    </>
  );
};

const renderInlineElements = (text: string): React.ReactNode => {
  // Regex to match: inline code `...`, bold **...**, italic *...*, @AI, @username, URLs
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@AI\b|@[a-zA-Z0-9_-]+|https?:\/\/[^\s]+)/gi);

  return tokens.map((token, index) => {
    if (!token) return null;

    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={index} className="font-semibold text-zinc-100">{renderInlineElements(token.slice(2, -2))}</strong>;
    }

    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={index} className="italic text-zinc-300">{renderInlineElements(token.slice(1, -1))}</em>;
    }

    if (token.toLowerCase() === '@ai') {
      return (
        <span key={index} className="mention-ai">
          <Sparkles size={11} />
          @AI
        </span>
      );
    }

    if (token.startsWith('@') && token.length > 1) {
      return (
        <span key={index} className="mention-user">
          {token}
        </span>
      );
    }

    if (token.startsWith('http://') || token.startsWith('https://')) {
      return (
        <a
          key={index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-400 hover:underline hover:text-teal-300 transition-colors"
        >
          {token}
        </a>
      );
    }

    return token;
  });
};
