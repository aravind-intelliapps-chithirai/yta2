// src/utils/emojiData.ts

// MAPPING: Unicode Emoji -> Path to PNG/Texture
// The path is relative to the Remotion 'public' folder.
const EMOJI_MAP = new Map<string, string>([
    ['⚡', '/assets/emojis/high_voltage.png'],
    ['🚀', '/assets/emojis/rocket.png'],
    ['⏱️', '/assets/emojis/stopwatch.png'],
    ['💯', '/assets/emojis/hundred_points.png'],
    ['🔥', '/assets/emojis/fire.png'],
    ['🎯', '/assets/emojis/bullseye.png'],
    ['✨', '/assets/emojis/sparkles.png'],
    ['💥', '/assets/emojis/collision.png'],
    ['🌟', '/assets/emojis/glowing_star.png'],
    ['🔔', '/assets/emojis/bell.png'],
    ['📎', '/assets/emojis/paperclip.png'],
    ['📚', '/assets/emojis/books.png'],
    ['💪', '/assets/emojis/flexed_biceps.png'],
    ['📖', '/assets/emojis/open_book.png'],
    // Handle the special case where the stopwatch has a variant selector in your source
    ['⏱', '/assets/emojis/stopwatch.png'], // Base character
]);

// REGEX: Regex to find any of the mapped emojis in the text string
// The 'gu' flags ensure global search and correct handling of complex unicode characters.
const EMOJI_REGEX = new RegExp(
    [...EMOJI_MAP.keys()].map(e => e.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')).join('|'),
    'gu'
);

export const getEmojiData = () => ({
    map: EMOJI_MAP,
    regex: EMOJI_REGEX,
});