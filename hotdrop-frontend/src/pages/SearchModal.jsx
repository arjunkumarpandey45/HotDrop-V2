import { useEffect, useState, useRef } from "react";
import { Search, X, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/Api";
import dp from "../assets/dp.jpg";

function SearchModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    } else {
      setSearchQuery("");
      setSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        let userList = [];

        // 🎯 Attempt 1: GET /users/search/{query}
        try {
          const res = await API.get(`/users/suggestions/${encodeURIComponent(q)}`);
          const data = res.data;
          userList = Array.isArray(data)
            ? data
            : data?.data || data?.users || data?.user || [];

          if (!Array.isArray(userList) && typeof userList === "object" && (userList.hotdropId || userList.username)) {
            userList = [userList];
          }
        } catch {
          // Fallback if 400 Bad Request is returned (e.g., query params /users/search?query=q)
          try {
            const res2 = await API.get(`/users/search`, { params: { query: q, q, hotdropId: q } });
            const data2 = res2.data;
            userList = Array.isArray(data2)
              ? data2
              : data2?.data || data2?.users || [];
          } catch {
            userList = [];
          }
        }

        if (!Array.isArray(userList)) {
          userList = [];
        }

        // Filter & Slice to MAX 5 items
        const lowerQ = q.toLowerCase();
        const matched = userList.filter((u) => {
          if (!u) return false;
          const hId = (u.hotdropId || u.username || "").toLowerCase();
          const fName = (u.firstName || "").toLowerCase();
          const lName = (u.lastName || "").toLowerCase();
          return hId.includes(lowerQ) || fName.includes(lowerQ) || lName.includes(lowerQ);
        });

        const finalResults = (matched.length > 0 ? matched : userList).slice(0, 5);
        setSuggestions(finalResults);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectUser = (hotdropId) => {
    if (!hotdropId) return;
    onClose();
    navigate(`/user/userprofile/${hotdropId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && searchQuery.trim()) {
      if (suggestions.length > 0) {
        handleSelectUser(suggestions[0].hotdropId || suggestions[0].username);
      } else {
        handleSelectUser(searchQuery.trim());
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SEARCH INPUT HEADER */}
        <div className="flex items-center gap-3 p-3.5 px-4 sm:px-5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type at least 1 letter to search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition"
            >
              <X size={16} />
            </button>
          )}
       
        </div>

        {/* RESULTS SECTION (MAX 5 ITEMS) */}
        <div className="p-3 max-h-[380px] overflow-y-auto">
          {searchQuery.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <Sparkles size={28} className="text-orange-400 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-600">Start typing to search creators</p>
               </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8 text-xs font-semibold text-slate-400">
              Searching creators...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1">
             
              {suggestions.slice(0, 5).map((s, index) => {
                const avatar =
                  s.profilePicture || s.profileImageUrl || s.avatar || dp;
                const name = s.firstName
                  ? `${s.firstName} ${s.lastName || ""}`.trim()
                  :  "Creator";
                const handle = s.hotdropId || s.username || "user";

                return (
                  <div
                    key={s._id || s.id || index}
                    onClick={() => handleSelectUser(handle)}
                    className="flex items-center gap-3 p-2.5 px-3 rounded-2xl cursor-pointer hover:bg-blue-50/80 transition group border border-transparent hover:border-blue-100"
                  >
                    <img
                      src={avatar}
                      alt={handle}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        @{handle}
                      </span>
                      {name && (
                        <span className="text-[11px] font-medium text-slate-500 truncate">
                          {name}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No matching creators found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
