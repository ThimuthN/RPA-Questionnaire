function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const colors = ["indigo", "blue", "cyan", "emerald", "amber", "pink"];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function UserAvatarInitials({
  name,
  email,
  size = "md"
}: {
  name: string | null | undefined;
  email: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = hashStringToColor(email);
  const initials = getInitials(name, email);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  const colorBg = {
    indigo: "bg-indigo-500/20",
    blue: "bg-blue-500/20",
    cyan: "bg-cyan-500/20",
    emerald: "bg-emerald-500/20",
    amber: "bg-amber-500/20",
    pink: "bg-pink-500/20"
  };

  const colorText = {
    indigo: "text-indigo-600",
    blue: "text-blue-600",
    cyan: "text-cyan-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    pink: "text-pink-600"
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${colorBg[color as keyof typeof colorBg]} ${colorText[color as keyof typeof colorText]} flex items-center justify-center font-semibold`}
    >
      {initials}
    </div>
  );
}
