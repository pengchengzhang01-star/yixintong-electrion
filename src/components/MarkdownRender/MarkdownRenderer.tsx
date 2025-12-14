import "./MarkdownRenderer.scss";

import React, { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown, className }) => {
  const [copyStates, setCopyStates] = React.useState<{ [key: string]: string }>({});

  const copyToClipboard = useCallback((code: string, blockId: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopyStates((prev) => ({ ...prev, [blockId]: "已复制！" }));
        setTimeout(() => {
          setCopyStates((prev) => ({ ...prev, [blockId]: "复制" }));
        }, 2000);
      })
      .catch((err) => {
        console.error("复制失败:", err);
        setCopyStates((prev) => ({ ...prev, [blockId]: "复制失败" }));
        setTimeout(() => {
          setCopyStates((prev) => ({ ...prev, [blockId]: "复制" }));
        }, 2000);
      });
  }, []);

  return (
    <div className={`markdown-renderer ${className || ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const match = /language-(\w+)/.exec(className || "");
            const code = String(children).replace(/\n$/, "");
            const blockId = code.slice(0, 20); // 使用代码前20个字符作为唯一标识

            if (!inline && match) {
              // 确保该代码块有初始复制状态
              if (!copyStates[blockId]) {
                setCopyStates((prev) => ({ ...prev, [blockId]: "复制" }));
              }
              const language = className
                ? className.replace("language-", "")
                : "plaintext";
              return (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span className="code-language">{match[1]}</span>
                    <button
                      className="copy-button"
                      onClick={() => copyToClipboard(code, blockId)}
                      aria-label="复制代码"
                    >
                      {copyStates[blockId] || "复制"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={atomOneDark}
                    language={language}
                    showLineNumbers
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
