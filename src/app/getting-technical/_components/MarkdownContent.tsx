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
          <h1 className="mb-4 mt-8 text-2xl font-bold text-foreground first:mt-0 sm:text-3xl">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-8 text-xl font-bold text-foreground first:mt-0 sm:text-2xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-6 text-lg font-semibold text-foreground">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed text-foreground/70">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-foreground/50">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1.5 text-foreground/70">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-foreground/70">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline decoration-gold/30 underline-offset-2 transition-colors hover:decoration-gold"
          >
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-lg border border-foreground/10 bg-surface-950 p-4 text-sm leading-relaxed text-foreground/80">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-foreground/10 px-1.5 py-0.5 text-sm text-gold">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-4">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-gold/40 pl-4 text-foreground/60 italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-foreground/20">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground/60">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-foreground/5 px-3 py-2 text-foreground/70">
            {children}
          </td>
        ),
        hr: () => <hr className="my-8 border-foreground/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
