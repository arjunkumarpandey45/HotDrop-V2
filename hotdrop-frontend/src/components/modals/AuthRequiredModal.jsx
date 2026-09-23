import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

function AuthRequiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button 
        type="button"
        aria-label="Close sign in modal"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer border-0 p-0" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative bg-white w-full max-w-[320px] rounded-3xl p-6 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={26} />
        </div>
        <h2 className="text-base font-black text-slate-900 mb-1 uppercase tracking-tight">Sign In Required</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
          Please log in to like, comment & unlock project link previews on HotDrop.
        </p>
        <div className="flex flex-col gap-2.5">
          <button 
            type="button"
            onClick={() => {
              onClose();
              navigate("/login");
            }} 
            className="w-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={onClose} 
            className="w-full bg-slate-100 text-slate-600 text-xs font-bold py-2.5 rounded-2xl hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
        <p className="mt-4 text-[11px] text-slate-400 font-medium">
          New here? <Link to="/signup" className="text-blue-600 font-bold hover:underline" onClick={onClose}>Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default AuthRequiredModal;
