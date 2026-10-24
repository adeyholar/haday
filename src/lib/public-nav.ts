export const PUBLIC_NAV = [
  { to: "/blogs", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/login", label: "Sign in" },
] as const;

export const FOOTER_NAV = [
  { to: "/", label: "HaDay" },
  { to: "/about", label: "About" },
  { to: "/blogs", label: "Blog" },
  { to: "/legal", label: "Legal" },
  { to: "/credits", label: "Credits" },
  { to: "/about", label: "Contact", hash: "contact" },
] as const;

export const STUDY_MENU_BLOG = { to: "/blogs", label: "Blog", hint: "Teachings and guides" } as const;
