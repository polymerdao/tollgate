"use client";

import { ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getUserFromSession, type SessionState } from "@/lib/types";

export function Topbar({
  title,
  onOpenNav,
  action
}: {
  title: string;
  onOpenNav: () => void;
  action?: React.ReactNode;
}) {
  const sessionState = useSession() as SessionState;
  const user = getUserFromSession(sessionState);
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
    : user?.email?.slice(0, 2)?.toUpperCase() ?? "TG";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenNav}
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 border border-border bg-muted/50 py-1.5 pl-1.5 pr-3 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-muted"
            >
              <Avatar className="h-7 w-7 rounded-none">
                <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
                <AvatarFallback className="rounded-none bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {user?.email ?? "Account"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
