import { useEffect, useState } from "react";
import { Loader2, User, KeyRound, Save } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import { getMe, updateProfile, changePassword } from "../services/profileService";
import { initials } from "../utils/ui";

const inputCls =
  "h-11 w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 text-sm text-stone-800 outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";
const labelCls = "mb-1.5 block text-[12.5px] font-semibold text-stone-600";

const GENDERS = [
  { value: "", label: "Belirtmek istemiyorum" },
  { value: "KADIN", label: "Kadın" },
  { value: "ERKEK", label: "Erkek" },
];

// Profil sayfası — kişisel bilgi güncelleme + şifre değiştirme.
// Tüm giriş yapmış roller erişebilir (avatar → /profil).
export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Kişisel bilgi formu
  const [form, setForm] = useState({ name: "", email: "", phone: "", birthDate: "", gender: "", address: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  // Şifre formu
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await getMe();
        if (active) {
          setForm({
            name: me.name || "",
            email: me.email || "",
            phone: me.phone || "",
            birthDate: me.birthDate || "",
            gender: me.gender || "",
            address: me.address || "",
          });
        }
      } catch {
        if (active) toast.error("Profil bilgileri yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveInfo = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ad Soyad boş olamaz.");
      return;
    }
    setSavingInfo(true);
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        phone: form.phone,
        birthDate: form.birthDate,
        gender: form.gender,
        address: form.address,
      });
      updateUser({ name: updated.name }); // navbar adı güncellensin
      toast.success("Profiliniz güncellendi.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Profil güncellenemedi.");
    } finally {
      setSavingInfo(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pw.current || !pw.next) {
      toast.error("Mevcut ve yeni şifreyi girin.");
      return;
    }
    if (pw.next.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Yeni şifreler eşleşmiyor.");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(pw.current, pw.next);
      toast.success("Şifreniz güncellendi.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Şifre değiştirilemedi.");
    } finally {
      setSavingPw(false);
    }
  };

  const ROLE_LABELS = { HASTA: "Hasta", DOKTOR: "Doktor", ADMIN: "Yönetici" };

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />

      <main className="mx-auto max-w-[860px] animate-fadeUp px-6 pb-16 pt-8">
        {/* Başlık kartı */}
        <div className="mb-[22px] flex items-center gap-4 rounded-[20px] border border-stone-200 bg-white px-6 py-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-xl font-extrabold text-teal-700">
            {initials(user?.name)}
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">{user?.name}</h1>
            <p className="text-sm text-stone-500">
              {form.email} · {ROLE_LABELS[user?.role] || ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin" /> Profil yükleniyor…
          </div>
        ) : (
          <div className="grid items-start gap-[22px] lg:grid-cols-[1.4fr_1fr]">
            {/* Kişisel bilgiler */}
            <form onSubmit={saveInfo} className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-[18px] w-[18px] text-teal-600" />
                <h2 className="text-base font-extrabold">Kişisel Bilgiler</h2>
              </div>
              <div className="flex flex-col gap-3.5">
                <label className="block">
                  <span className={labelCls}>Ad Soyad</span>
                  <input value={form.name} onChange={setField("name")} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>E-posta <span className="font-medium text-stone-400">(değiştirilemez)</span></span>
                  <input value={form.email} disabled className={inputCls} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelCls}>Telefon</span>
                    <input value={form.phone} onChange={setField("phone")} placeholder="0555 123 45 67" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Doğum Tarihi</span>
                    <input type="date" value={form.birthDate} onChange={setField("birthDate")} className={inputCls} />
                  </label>
                </div>
                <label className="block">
                  <span className={labelCls}>Cinsiyet</span>
                  <select value={form.gender} onChange={setField("gender")} className={inputCls}>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Adres</span>
                  <textarea
                    value={form.address}
                    onChange={setField("address")}
                    placeholder="Açık adresiniz…"
                    className="h-20 w-full resize-y rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:border-teal-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="mt-1 flex h-11 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Bilgileri Kaydet
                </button>
              </div>
            </form>

            {/* Şifre değiştirme */}
            <form onSubmit={savePassword} className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-[18px] w-[18px] text-teal-600" />
                <h2 className="text-base font-extrabold">Şifre Değiştir</h2>
              </div>
              <div className="flex flex-col gap-3.5">
                <label className="block">
                  <span className={labelCls}>Mevcut Şifre</span>
                  <input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••" className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Yeni Şifre <span className="font-medium text-stone-400">(en az 6)</span></span>
                  <input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••" className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Yeni Şifre (Tekrar)</span>
                  <input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••" className={inputCls} />
                </label>
                <button
                  type="submit"
                  disabled={savingPw}
                  className="mt-1 flex h-11 items-center justify-center gap-2 rounded-[11px] border border-stone-200 bg-stone-50 text-sm font-bold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
