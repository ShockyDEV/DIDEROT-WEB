import { cn } from "@/lib/cn";

interface InitialsAvatarProps {
  initials: string;
  className?: string;
}

/**
 * Avatar circular con iniciales, para las tarjetas de miembros. Es puramente
 * decorativo (`aria-hidden`): el nombre completo va siempre junto al avatar.
 */
export function InitialsAvatar({
  initials,
  className,
}: Readonly<InitialsAvatarProps>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-diderot-pale text-sm font-bold text-ink",
        className,
      )}
    >
      {initials}
    </span>
  );
}
