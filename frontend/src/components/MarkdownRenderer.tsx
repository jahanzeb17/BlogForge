import { Fragment, useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";

type Props = {
  markdown: string;
  runId?: string;
};

type AuthenticatedImageProps = {
  src: string;
  alt: string;
  title?: string;
};

function AuthenticatedImage({ src, alt, title }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadImage() {
      try {
        const token = localStorage.getItem("blogforge_token");

        const response = await fetch(src, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        if (!response.ok) {
          throw new Error(`Image request failed: ${response.status}`);
        }

        const blob = await response.blob();

        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setFailed(false);
      } catch (error) {
        console.error("Failed to load blog image:", error);

        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (failed) {
    return (
      <div className="my-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Unable to load this image.
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div className="my-5 flex min-h-[180px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400">
        Loading image...
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      title={title}
      className="my-5 max-w-full rounded-lg border border-slate-200"
    />
  );
}

function inline(text: string, runId?: string): ReactNode[] {
  const pattern =
    /(\!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\))|(\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)|(\`([^`]+)\`)/g;

  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    /*
     * Markdown image
     *
     * Backend produces:
     *
     * ![alt text](images/generated-image.png)
     *
     * We convert that relative backend path into the authenticated
     * image endpoint.
     */
    if (match[1]) {
      const alt = match[2] || "";
      const rawUrl = match[3] || "";
      const title = match[4];

      if (
        runId &&
        (rawUrl.startsWith("images/") || rawUrl.startsWith("./images/"))
      ) {
        const filename = rawUrl.replace(/^\.?\//, "").replace(/^images\//, "");

        const imageUrl = api.imageUrl(runId, filename);

        nodes.push(
          <AuthenticatedImage
            key={`img-${match.index}`}
            src={imageUrl}
            alt={alt}
            title={title}
          />,
        );
      } else {
        /*
         * External/public image.
         */
        nodes.push(
          <img
            key={`img-${match.index}`}
            src={rawUrl}
            alt={alt}
            title={title}
            className="my-5 max-w-full rounded-lg border border-slate-200"
          />,
        );
      }
    } else if (match[5]) {
      const label = match[6] || "";
      const url = match[7] || "";
      const title = match[8];

      nodes.push(
        <a
          key={`a-${match.index}`}
          href={url}
          title={title}
          target="_blank"
          rel="noreferrer"
          className="break-words text-indigo-600 hover:underline"
        >
          {label}
        </a>,
      );
    } else if (match[9] || match[11]) {
      nodes.push(
        <strong key={`b-${match.index}`}>{match[10] || match[12]}</strong>,
      );
    } else if (match[13] || match[15]) {
      nodes.push(<em key={`i-${match.index}`}>{match[14] || match[16]}</em>);
    } else if (match[17]) {
      nodes.push(
        <code
          key={`c-${match.index}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {match[18]}
        </code>,
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

function splitTableRow(line: string) {
  const value = line.trim().replace(/^\|/, "").replace(/\|$/, "");

  return value.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

export default function MarkdownRenderer({ markdown, runId }: Props) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");

  const blocks: ReactNode[] = [];

  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    /*
     * Fenced code blocks
     */
    if (line.startsWith("```")) {
      const code: string[] = [];

      i += 1;

      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }

      if (i < lines.length) {
        i += 1;
      }

      blocks.push(
        <pre
          key={blockKey++}
          className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100"
        >
          <code className="font-mono">{code.join("\n")}</code>
        </pre>,
      );

      continue;
    }

    /*
     * Markdown tables
     */
    if (
      /^\|.*\|/.test(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = splitTableRow(line);

      i += 2;

      const rows: string[][] = [];

      while (i < lines.length && /^\|.*\|/.test(lines[i]) && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }

      blocks.push(
        <div key={blockKey++} className="my-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold"
                  >
                    {inline(header, runId)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="border border-slate-200 px-3 py-2 align-top"
                    >
                      {inline(row[columnIndex] || "", runId)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );

      continue;
    }

    /*
     * Headings
     */
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);

    if (heading) {
      const level = Math.min(heading[1].length, 6);

      const classes = [
        "",
        "text-3xl font-bold mt-2 mb-5",
        "text-xl font-bold mt-8 mb-3",
        "text-lg font-semibold mt-6 mb-2",
        "text-base font-semibold mt-5 mb-2",
        "text-sm font-semibold mt-4 mb-2",
        "text-sm font-semibold mt-4 mb-2",
      ][level];

      const Tag = `h${level}` as any;

      blocks.push(
        <Tag key={blockKey++} className={classes}>
          {inline(heading[2], runId)}
        </Tag>,
      );

      i += 1;
      continue;
    }

    /*
     * Horizontal rule
     */
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={blockKey++} className="my-6 border-slate-200" />);

      i += 1;
      continue;
    }

    /*
     * Blockquotes
     */
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];

      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));

        i += 1;
      }

      blocks.push(
        <blockquote
          key={blockKey++}
          className="my-5 border-l-4 border-indigo-200 pl-4 text-sm italic text-slate-600"
        >
          {quote.map((q, index) => (
            <Fragment key={index}>
              {inline(q, runId)}

              {index < quote.length - 1 && <br />}
            </Fragment>
          ))}
        </blockquote>,
      );

      continue;
    }

    /*
     * Ordered and unordered lists
     */
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);

      const items: string[] = [];

      const regex = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;

      while (i < lines.length) {
        const match = lines[i].match(regex);

        if (!match) break;

        items.push(match[1]);

        i += 1;
      }

      const ListTag = ordered ? "ol" : "ul";

      blocks.push(
        <ListTag
          key={blockKey++}
          className={`my-4 ml-6 space-y-1 text-sm leading-7 ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {items.map((item, index) => (
            <li key={index}>{inline(item, runId)}</li>
          ))}
        </ListTag>,
      );

      continue;
    }

    /*
     * Normal paragraphs
     */
    const paragraph: string[] = [line];

    i += 1;

    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+|^\s*>|^\s*[-*+]\s+|^\s*\d+[.)]\s+|^```|^\|.*\|/.test(
        lines[i],
      )
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }

    blocks.push(
      <p key={blockKey++} className="my-3 text-sm leading-7 text-slate-700">
        {paragraph.map((part, index) => (
          <Fragment key={index}>
            {inline(part, runId)}

            {index < paragraph.length - 1 && <br />}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <>{blocks}</>;
}
