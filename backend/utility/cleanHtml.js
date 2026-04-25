export default function cleanTitle(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .trim();
}