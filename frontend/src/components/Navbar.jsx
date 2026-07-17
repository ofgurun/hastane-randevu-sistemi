import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import useAuthStore from "../store/authStore";
import { initials } from "../utils/ui";

const ROLE_LABELS = { HASTA: "Hasta", DOKTOR: "Doktor", ADMIN: "Yönetici" };

// Marka logosu — teal karo içinde artı işareti
export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-teal-600 shadow-[0_4px_12px_rgba(13,148,136,.28)]">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>
      <div className="leading-[1.05]">
        <div className="text-[17px] font-extrabold tracking-tight text-stone-800">
          Medi<span className="text-teal-600">Randevu</span>
        </div>
        <div className="text-[10.5px] font-semibold tracking-[.06em] text-stone-400">SAĞLIK MERKEZİ</div>
      </div>
    </div>
  );
}

// Paylaşılan üst bar. Role göre menü: ADMIN → Yönetim; DOKTOR → Ajandam;
// HASTA → Ana Sayfa + Randevularım.
export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { pathname } = useLocation();
  const role = user?.role;

  const linkCls = (active) =>
    `rounded-[10px] px-[15px] py-2 text-sm font-bold transition ${
      active ? "bg-teal-50 text-teal-700" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
    }`;

  let links;
  if (role === "ADMIN") {
    links = (
      <Link to="/admin" className={linkCls(pathname === "/admin")}>
        Yönetim Paneli
      </Link>
    );
  } else if (role === "DOKTOR") {
    links = (
      <Link to="/doctor-dashboard" className={linkCls(pathname === "/doctor-dashboard")}>
        Ajandam
      </Link>
    );
  } else {
    links = (
      <>
        <Link to="/" className={linkCls(pathname === "/")}>
          Ana Sayfa
        </Link>
        <Link to="/appointments" className={linkCls(pathname === "/appointments")}>
          Randevularım
        </Link>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-[66px] max-w-[1200px] items-center gap-5 px-6">
        <Brand />
        <nav className="ml-3 hidden items-center gap-1 sm:flex">{links}</nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13.5px] font-bold text-stone-800">{user?.name}</div>
            <div className="text-[11px] font-semibold text-stone-400">{ROLE_LABELS[role] || ""}</div>
          </div>
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-sm font-bold text-teal-700">
            {initials(user?.name)}
          </div>
          <button
            onClick={logout}
            title="Çıkış"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-stone-200 bg-stone-50 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <LogOut className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
      {/* Mobil gezinme */}
      <nav className="flex items-center gap-1 border-t border-stone-100 px-4 py-2 sm:hidden">{links}</nav>
    </header>
  );
}
