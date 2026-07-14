import { Link, useLocation } from "react-router-dom";
import { LogOut, Home as HomeIcon, CalendarClock, ClipboardList } from "lucide-react";
import Logo from "./Logo";
import useAuthStore from "../store/authStore";

// Paylaşılan üst bar. Doktor ise yalnızca "Ajandam"; hasta ise "Ana Sayfa" + "Randevularım".
export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { pathname } = useLocation();
  const isDoctor = user?.role === "DOKTOR";

  const linkCls = (active) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
    }`;

  const links = isDoctor ? (
    <Link to="/doctor-dashboard" className={linkCls(pathname === "/doctor-dashboard")}>
      <ClipboardList className="h-4 w-4" /> Ajandam
    </Link>
  ) : (
    <>
      <Link to="/" className={linkCls(pathname === "/")}>
        <HomeIcon className="h-4 w-4" /> Ana Sayfa
      </Link>
      <Link to="/appointments" className={linkCls(pathname === "/appointments")}>
        <CalendarClock className="h-4 w-4" /> Randevularım
      </Link>
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">{links}</nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            Merhaba, <span className="font-semibold">{user?.name}</span>
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>
      </div>
      {/* Mobil gezinme */}
      <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">{links}</nav>
    </header>
  );
}
