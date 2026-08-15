import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Replaces react-markdown + remark-gfm.
 *
 * Output is sanitised before it reaches `{@html}`. The content originates in server Lua
 * rather than from players, but `lib.notify` descriptions do carry player-supplied text
 * in some resources (item names, character names), so this is not a formality.
 */
export function renderMarkdown(source?: string): string {
  if (!source) return '';

  const html = marked.parse(source, { async: false, gfm: true, breaks: true }) as string;

  return DOMPurify.sanitize(html);
}
