import { useState } from "react";
import axios from "axios";
import { LogOut, ArrowLeft, UtensilsCrossed, Images } from "lucide-react";
import { Logo } from "./Logo";
import { API, TOKEN_KEY, Field, inputCls } from "./admin/ui";
import { MenuManager } from "./admin/MenuManager";
import { SitePhotos } from "./admin/SitePhotos";

const TABS = [
  ["menu", "Menu", UtensilsCrossed],
  ["photos", "Foto del sito", Images],
];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("menu");

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const { data } = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Errore di accesso");
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-4">
        <form onSubmit={login} data-testid="admin-login-form" className="bg-cream border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard w-full max-w-md">
          <div className="flex flex-col gap-4 mb-8">
            <Logo variant="dark" className="h-14" testId="admin-logo-img" />
            <h1 className="font-display text-4xl text-ink tracking-wide">AREA ADMIN</h1>
          </div>
          <Field label="Password" testId="admin-password-field">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="admin-password-input" className={inputCls} placeholder="••••••••" />
          </Field>
          {loginError && <p data-testid="admin-login-error" className="mt-3 text-sm font-bold text-coral">{loginError}</p>}
          <button type="submit" data-testid="admin-login-btn" className="mt-6 w-full bg-lemon text-ink border-2 border-ink rounded-full px-8 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
            Accedi
          </button>
          <a href="/" data-testid="admin-back-home" className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-ink/60 hover:text-ocean transition-colors">
            <ArrowLeft className="w-4 h-4" /> Torna al sito
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink border-b-2 border-ink sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo variant="yellow" className="h-9" testId="admin-header-logo" />
            <span className="hidden sm:inline font-display text-2xl text-cream tracking-wide">ADMIN</span>
          </div>
          <nav data-testid="admin-tabs" className="flex items-center gap-1 bg-cream/10 rounded-full p-1">
            {TABS.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} data-testid={`admin-tab-${id}`} className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${tab === id ? "bg-lemon text-ink" : "text-cream/80 hover:text-lemon"}`}>
                <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="/" data-testid="admin-view-site" className="hidden md:inline-flex items-center gap-2 text-cream/80 hover:text-lemon text-sm font-bold uppercase tracking-wide transition-colors">
              Vedi il sito
            </a>
            <button onClick={logout} data-testid="admin-logout-btn" className="inline-flex items-center gap-2 bg-cream text-ink border-2 border-cream rounded-full px-4 py-1.5 font-bold text-sm uppercase shadow-hard-sm btn-lift">
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </div>
        </div>
      </header>

      <main data-testid="admin-dashboard" className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {tab === "menu" ? <MenuManager onUnauthorized={logout} /> : <SitePhotos onUnauthorized={logout} />}
      </main>
    </div>
  );
}
