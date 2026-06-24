"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faCamera, faImages, faPhotoFilm } from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { href: "/", label: "Home", icon: faHouse },
  { href: "/camera", label: "Camera", icon: faCamera },
  { href: "/rolls", label: "Rolls", icon: faPhotoFilm },
  { href: "/archive", label: "Archive", icon: faImages },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/share/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
