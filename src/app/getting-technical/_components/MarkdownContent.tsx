"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-foreground mt-8 mb-4 text-2xl font-bold first:mt-0 sm:text-3xl">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-foreground mt-8 mb-3 text-xl font-bold first:mt-0 sm:text-2xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-foreground mt-6 mb-2 text-lg font-semibold">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-foreground/70 mb-4 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="text-foreground font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-foreground/50">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="text-foreground/70 mb-4 ml-6 list-disc space-y-1.5">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="text-foreground/70 mb-4 ml-6 list-decimal space-y-1.5">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold decoration-gold/30 hover:decoration-gold underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="border-foreground/10 bg-surface-950 text-foreground/80 block overflow-x-auto rounded-lg border p-4 text-sm leading-relaxed">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-foreground/10 text-gold rounded px-1.5 py-0.5 text-sm">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-4">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-gold/40 text-foreground/60 mb-4 border-l-4 pl-4 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-foreground/20 border-b">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-foreground/60 px-3 py-2 text-left text-xs font-semibold tracking-wider uppercase">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-foreground/5 text-foreground/70 border-b px-3 py-2">
            {children}
          </td>
        ),
        hr: () => <hr className="border-foreground/10 my-8" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
