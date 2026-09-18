import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();

  const currentPage = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Assurance Platform
          </p>

          <h1 className="mt-0.5 text-lg font-semibold capitalize text-slate-900">
            {currentPage || "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>

          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
