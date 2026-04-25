import sanitizeHtml from "sanitize-html";

export default function cleanQuillHtml(html = "") {
  if (typeof html !== "string") return "";

  // 1) Preserve Quill blank paragraphs: <p><br></p> -> <p>&nbsp;</p>
  let out = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "<p>&nbsp;</p>");

  // 2) Remove truly empty paragraphs only (NOT &nbsp;)
  out = out.replace(/<p>\s*<\/p>/gi, "");

  // 3) Sanitize while keeping links and common Quill formatting
  out = sanitizeHtml(out, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
    ]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt"],
      span: ["style", "class"],
      p: ["style", "class"],
      h1: ["style", "class"],
      h2: ["style", "class"],
      h3: ["style", "class"],
      h4: ["style", "class"],
      h5: ["style", "class"],
      h6: ["style", "class"],
      ul: ["class"],
      ol: ["class"],
      li: ["class"],
      blockquote: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    allowedStyles: {
      "*": {
        color: [/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, /^rgb\((\d+),\s?(\d+),\s?(\d+)\)$/],
        "background-color": [/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, /^rgb\((\d+),\s?(\d+),\s?(\d+)\)$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });

  return out.trim();
}