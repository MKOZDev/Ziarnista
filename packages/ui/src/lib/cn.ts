import { createCn } from 'cn/config';

// Must list the custom scales from theme.css. Without this, 'text-label' is treated as a text
// color and silently removed by 'text-foreground', and 'h-control-*' classes never override each other.
export const cn = createCn({
  extend: {
    theme: {
      spacing: ['control-sm', 'control-md', 'control-lg', 'sidebar', 'topbar'],
      container: ['content'],
    },
    classGroups: {
      'font-size': [{ text: ['caption', 'label', 'body', 'title', 'page', 'stat', 'display'] }],
    },
  },
});
