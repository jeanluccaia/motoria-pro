"use client";

import Link from "next/link";
import { Home, CreditCard, Star, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  key: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Início", key: "dashboard" },
  { href: "/plano", icon: CreditCard, label: "Meu Plano", key: "plano" },
  { href: "/beneficios", icon: Star, label: "Benefícios", key: "beneficios" },
  { href: "/historico", icon: Clock, label: "Histórico", key: "historico" },
  { href: "/perfil", icon: User, label: "Perfil", key: "perfil" },
];

interface BottomNavProps {
  active: string;
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="glass-card border-t border-white/10 mx-0">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                  isActive ? "text-[#C9A84C]" : "text-[#9CA3AF] hover:text-white"
                )}
              >
                <Icon
                  size={22}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "drop-shadow-[0_0_6px_rgba(201,168,76,0.6)]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide",
                    isActive ? "text-[#C9A84C]" : "text-[#9CA3AF]"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C9A84C]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
