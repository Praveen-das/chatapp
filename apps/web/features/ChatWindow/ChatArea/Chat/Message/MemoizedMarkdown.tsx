import { defaultRehypePlugins, Streamdown } from "streamdown";
import { memo } from "react";

export const MemoizedMarkdown = memo(
  ({ content, mode = "static" }: { content: string; id: string; mode?: "static" | "streaming" }) => {
    return (
      <Streamdown
        rehypePlugins={[defaultRehypePlugins.raw!]}
        components={{ img: () => content, a: () => content }}
        className="whitespace-pre-wrap"
        shikiTheme={["github-dark", "github-light"]}
        mode={mode}
        isAnimating={mode === "streaming" ? true : false}
      >
        {content}
      </Streamdown>
    );
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
