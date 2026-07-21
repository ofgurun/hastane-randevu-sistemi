import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bell,
  CalendarPlus,
  CalendarX2,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Plane,
  Star,
  CheckCheck,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

// 60 sn'de bir yeni bildirim kontrolü (polling)
const POLL_MS = 60_000;

// Bildirim tipine göre ikon + renk (yalnızca görsel)
const VISUALS = {
  RANDEVU_OLUSTURULDU: { Icon: CalendarPlus, cls: "bg-teal-50 text-teal-600" },
  RANDEVU_IPTAL: { Icon: CalendarX2, cls: "bg-red-50 text-red-600" },
  RANDEVU_ERTELENDI: { Icon: CalendarClock, cls: "bg-sky-50 text-sky-600" },
  RANDEVU_TAMAMLANDI: { Icon: CircleCheck, cls: "bg-emerald-50 text-emerald-600" },
  RANDEVU_HATIRLATMA: { Icon: CalendarClock, cls: "bg-amber-50 text-amber-600" },
  RANDEVU_AKTARILDI: { Icon: CalendarClock, cls: "bg-sky-50 text-sky-600" },
  IZIN_TALEBI: { Icon: Plane, cls: "bg-violet-50 text-violet-600" },
  IZIN_KARARI: { Icon: ClipboardCheck, cls: "bg-indigo-50 text-indigo-600" },
  YENI_DEGERLENDIRME: { Icon: Star, cls: "bg-amber-50 text-amber-600" },
};
const DEFAULT_VISUAL = { Icon: Bell, cls: "bg-stone-100 text-stone-500" };

// ISO → "az önce / X dk önce / X saat önce / X gün önce / GG.AA.YYYY"
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} gün önce`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function NotificationBell() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevUnread = useRef(null); // önceki okunmamış sayısı (toast tetiği)
  const wrapRef = useRef(null);

  // Bildirimleri getirir; okunmamış sayısı arttıysa en yenisini toast'lar.
  const refresh = useCallback(async () => {
    try {
      const { items: list, unreadCount } = await getNotifications(20);
      setItems(list);
      setUnread(unreadCount);
      if (prevUnread.current !== null && unreadCount > prevUnread.current) {
        const newest = list.find((n) => !n.readAt) || list[0];
        if (newest) toast(`🔔 ${newest.title}`, { duration: 4000 });
      }
      prevUnread.current = unreadCount;
    } catch {
      // sessiz geç — polling bir sonraki turda tekrar dener
    }
  }, []);

  // İlk yükleme + periyodik polling (kullanıcı oturumu varken)
  useEffect(() => {
    if (!user) return;
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [user, refresh]);

  // Dışarı tıklayınca paneli kapat
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
      setLoading(false);
    }
  };

  const onItemClick = async (n) => {
    setOpen(false);
    if (!n.readAt) {
      // İyimser güncelleme
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      prevUnread.current = Math.max(0, (prevUnread.current ?? 1) - 1);
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const onMarkAll = async () => {
    if (unread === 0) return;
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })));
    setUnread(0);
    prevUnread.current = 0;
    try {
      await markAllNotificationsRead();
    } catch {
      /* sessiz */
    }
  };

  if (!user) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        title="Bildirimler"
        className={`relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border transition ${
          open
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }`}
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 flex max-h-[460px] w-[90vw] max-w-[350px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,.14)]">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div className="text-sm font-extrabold text-stone-800">Bildirimler</div>
            <button
              onClick={onMarkAll}
              disabled={unread === 0}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold text-teal-700 transition hover:bg-teal-50 disabled:cursor-default disabled:text-stone-300 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tümünü okundu
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-stone-400">Yükleniyor…</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Bell className="h-8 w-8 text-stone-300" />
                <div className="text-sm font-semibold text-stone-400">Henüz bildiriminiz yok</div>
              </div>
            ) : (
              items.map((n) => {
                const { Icon, cls } = VISUALS[n.type] || DEFAULT_VISUAL;
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-stone-50 px-4 py-3 text-left transition hover:bg-stone-50 ${
                      n.readAt ? "" : "bg-teal-50/40"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cls}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-stone-800">{n.title}</span>
                        {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-stone-500">{n.body}</div>
                      <div className="mt-1 text-[11px] font-semibold text-stone-400">{timeAgo(n.createdAt)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
