export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const TOKEN_KEY = "kalama_admin_token";

export const inputCls =
  "w-full border-2 border-ink bg-white rounded-xl h-11 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-ocean";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift";

export const Field = ({ label, children, testId }) => (
  <label className="block" data-testid={testId}>
    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

export const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}` } });
