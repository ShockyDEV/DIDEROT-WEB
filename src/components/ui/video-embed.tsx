/**
 * Vídeo de YouTube embebido (dominio youtube-nocookie: sin cookies hasta
 * reproducir). Acepta tanto URLs /embed/ como watch?v= o youtu.be.
 */
function toEmbedUrl(url: string): string {
  const watch = /(?:youtube(?:-nocookie)?\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (watch) return `https://www.youtube-nocookie.com/embed/${watch[1]}`;
  return url.replace("www.youtube.com/embed/", "www.youtube-nocookie.com/embed/");
}

export function VideoEmbed({
  src,
  title,
}: Readonly<{ src: string; title: string }>) {
  return (
    <iframe
      src={toEmbedUrl(src)}
      title={title}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="aspect-video w-full rounded-xl border border-gray-200 bg-black shadow-sm"
    />
  );
}
