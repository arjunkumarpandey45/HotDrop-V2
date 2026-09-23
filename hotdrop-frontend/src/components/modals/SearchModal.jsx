import { useEffect, useState, useRef } from "react";
import { Search, X, ArrowRight, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../api/Api";
import dp from "../../assets/dp.jpg";

function SearchModal({ isOpen, onClose, initialMode = "users" }) {
  const [searchMode, setSearchMode] = useState(initialMode); 
  const [searchQuery, setSearchQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [projectSuggestions, setProjectSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setSearchMode(initialMode);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setUserSuggestions([]);
      setProjectSuggestions([]);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    const rawQ = searchQuery.trim();
    if (!rawQ) {
      setUserSuggestions([]);
      setProjectSuggestions([]);
      setLoading(false);
      return;
    }

    const cleanQ = rawQ.replace(/^@/, "").trim();
    if (!cleanQ) {
      setUserSuggestions([]);
      setProjectSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);

      if (searchMode === "users") {

        try {
          let userList = [];

          try {
            const res1 = await API.get(`/users/suggestions/${encodeURIComponent(cleanQ)}`);
            const payload1 = res1.data?.data;
            userList = Array.isArray(payload1)
              ? payload1
              : payload1?.users || (payload1?.hotdropId ? [payload1] : []);
          } catch {

            try {
              const res2 = await API.get(`/users/search/${encodeURIComponent(cleanQ)}`);
              const payload2 = res2.data?.data;
              userList = Array.isArray(payload2)
                ? payload2
                : payload2?.hotdropId
                ? [payload2]
                : [];
            } catch {
              userList = [];
            }
          }

          const rawArr = Array.isArray(userList) ? userList : [];
          setUserSuggestions(rawArr.slice(0, 6));
        } catch (err) {
          console.error("Live user search error:", err);
          setUserSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {

        try {
          const res = await API.get("/posts/feed", {
            params: { page: 0, size: 6, search: cleanQ, sortBy: "created_at", direction: "DESC" },
          });
          const payload = res.data?.data;
          const postList = payload?.posts || (Array.isArray(payload) ? payload : []);
          setProjectSuggestions(postList.slice(0, 6));
        } catch (err) {
          console.error("Live post search error:", err);
          setProjectSuggestions([]);
        } finally {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  if (!isOpen) return null;

  const handleSelectUser = (hotdropId) => {
    const cleanId = (hotdropId || "").replace(/^@/, "").trim();
    if (!cleanId) return;
    onClose();
    navigate(`/user/userprofile/${cleanId}`);
  };

  const handleSelectProject = (titleOrQuery) => {
    onClose();
    navigate(`/search?q=${encodeURIComponent(titleOrQuery)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && searchQuery.trim()) {
      const cleanQ = searchQuery.replace(/^@/, "").trim();
      if (searchMode === "users") {
        if (userSuggestions.length > 0) {
          handleSelectUser(userSuggestions[0].hotdropId || userSuggestions[0].username || cleanQ);
        } else {
          handleSelectUser(cleanQ);
        }
      } else {
        handleSelectProject(cleanQ);
      }
    }
  };

  const activeCleanQuery = searchQuery.replace(/^@/, "").trim();

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-200 select-none">
      <button
        type="button"
        tabIndex={0}
        aria-label="Close search modal"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">

        <div className="flex items-center justify-between p-3 px-4 border-b border-slate-100 bg-slate-50/60">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSearchMode("users")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === "users"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
               HotDrop ID
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("projects")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === "projects"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Projects
            </button>
          </div>

        </div>

        <div className="flex items-center gap-3 p-3.5 px-4 sm:px-5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              searchMode === "users"
                ? "Type HotDrop ID or name..."
                : "Search project by title or #tag..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="p-3 max-h-[360px] overflow-y-auto">
          {searchQuery.trim().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-1">
              <span className="text-xs font-medium text-slate-500">
                {searchMode === "users"
                  ? "Type any HotDrop ID or name to search users"
                  : "Type title keywords or #tags to search projects"}
              </span>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8 text-xs font-medium text-slate-400">
              Searching suggestions...
            </div>
          ) : searchMode === "users" ? (

            <div className="space-y-1">
              {userSuggestions.map((s, index) => {
                const avatar = s.profilePicture || s.profileImageUrl || dp;
                const handle = s.hotdropId || s.username || "user";
                const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ");

                return (
                  <button
                    type="button"
                    key={s.id || s._id || index}
                    onClick={() => handleSelectUser(handle)}
                    className="w-full text-left flex items-center gap-3 p-2.5 px-3 rounded-2xl cursor-pointer hover:bg-blue-50/80 transition group border border-transparent hover:border-blue-100"
                  >
                    <img
                      src={avatar}
                      alt={handle}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        @{handle}
                      </span>
                      {fullName && (
                        <span className="text-[11px] font-medium text-slate-400 truncate">
                          {fullName}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 transition" />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleSelectUser(activeCleanQuery)}
                className="w-full mt-2 p-2.5 px-3 bg-blue-50 hover:bg-blue-100/80 text-blue-600 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer border border-blue-100"
              >
                <span>Open profile <strong>@{activeCleanQuery}</strong></span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (

            projectSuggestions.length > 0 ? (
              <div className="space-y-1">
                {projectSuggestions.map((post, index) => {
                  const pTitle = post.title || "Project ";
                  const pOwner = post.creator || post.user || {};
                  const pHandle = pOwner.hotdropId || pOwner.username || "dev";
                  const rawImages = post.imageUrls || post.images || [];
                  const firstImg = rawImages.length > 0
                    ? (typeof rawImages[0] === "string" ? rawImages[0] : rawImages[0]?.url)
                    : null;

                  return (
                    <button
                      type="button"
                      key={post.id || post._id || index}
                      onClick={() => handleSelectProject(post.title || activeCleanQuery)}
                      className="w-full text-left flex items-center justify-between p-2.5 px-3 rounded-2xl cursor-pointer hover:bg-slate-50 transition group border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                          {firstImg ? (
                            <img src={firstImg} alt={pTitle} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <div className="w-full h-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Globe size={16} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-extrabold text-slate-900 truncate group-hover:text-blue-600 uppercase">
                            {pTitle}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            by @{pHandle}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 transition" />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleSelectProject(activeCleanQuery)}
                  className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  View All Matching Projects <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-slate-400 text-xs font-medium">No direct project match for "{activeCleanQuery}"</p>
                <button
                  type="button"
                  onClick={() => handleSelectProject(activeCleanQuery)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Search Projects for "{activeCleanQuery}"
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
