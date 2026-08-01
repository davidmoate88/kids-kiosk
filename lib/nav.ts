export function getParentPath(pathname: string): string | null {
  if (pathname === "/home") return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "/home";
  return "/" + segments.slice(0, -1).join("/");
}
