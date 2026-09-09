
export function toEmbedUrl(url: string): string {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
    );
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  
    const aparatMatch = url.match(/aparat\.com\/video\/([\w-]+)/);
    if (aparatMatch)
      return `https://www.aparat.com/video/embed/${aparatMatch[1]}`;
  
    return url;
  }