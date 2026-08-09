interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ name, avatarUrl, size = 44 }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (avatarUrl) {
    return (
      <div className="avatar" style={style}>
        <img src={avatarUrl} alt={name} width={size} height={size} style={{ objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div className="avatar" style={style}>
      {initial}
    </div>
  );
}
