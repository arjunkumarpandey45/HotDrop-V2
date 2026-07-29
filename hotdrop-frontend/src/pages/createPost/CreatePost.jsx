import  { useState, useEffect } from "react";
import {
  X,
  Type,
  AlignLeft,
  Link as LinkIcon,
  Hash,
  ImagePlus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Globe,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";
import API from "../../api/Api";
import { useAuthStore } from "../../store/useAuthStore";
import { showPostErrorToast, showPostSuccessToast } from "../../toast/Toast";

// --- SUB-COMPONENT: POST PREVIEW MODAL ---
const PostPreview = ({ data, isOpen, onConfirm, onClose, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Preview
            </p>
            <h2 className="text-base font-extrabold text-slate-900">
              Review Your Drop
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-500 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="px-6 py-5 overflow-y-auto max-h-[55vh] space-y-5">
          {/* Images Grid */}
          <div className="grid grid-cols-3 gap-3">
            {data.images.length > 0 ? (
              data.images.slice(0, 3).map((img, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-100"
                >
                  <img
                    src={URL.createObjectURL(img)}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                No Screenshots Attached
              </div>
            )}
          </div>

          {/* Text Info */}
          <div>
            <h1 className="text-lg font-bold text-slate-900 mb-1 truncate">
              {data.title || "Untitled Project"}
            </h1>
            <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 font-normal">
              {data.description || "No description provided."}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {data.tags ? (
              data.tags.split(",").map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-100"
                >
                  <Tag className="h-3 w-3" />
                  {tag.trim()}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-xs italic">No tags added</span>
            )}
          </div>

          {/* URL & Live Status */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3 truncate pr-2">
              <Globe className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="truncate">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Target URL
                </p>
                <p className="text-xs font-medium text-slate-800 truncate">
                  {data.projectUrl || "Not provided"}
                </p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold rounded-full shrink-0 ${
                data.isLinkDead
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
            >
              {data.isLinkDead ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              {data.isLinkDead ? "DEAD" : "LIVE"}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition disabled:opacity-50"
          >
            Back to Edit
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-[1.5] py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing Drop...
              </>
            ) : (
              "Publish Drop"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: CREATE POST MODAL ---
const CreatePost = ({ isOpen, onClose }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [isLinkVerified, setIsLinkVerified] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectUrl: "",
    isLinkDead: true,
    tags: "",
    images: [],
  });

  // Lock body scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Spring Boot Link Verification Endpoint Handler
const checkUrl = async (url) => {
    if (!url || url.trim() === "") return;

    let formattedUrl = url.trim();

      if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // 2. Strict URL Regex Check (Covers www, TLDs, IP, ports, paths)
    const urlPattern = new RegExp(
      "^(https?:\\/\\/)" + // Protocol (mandatory after auto-prefix)
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // Domain (including www.domain.com)
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP Address
      "(\\:\\d+)?" + // Optional Port
      "(\\/[-a-z\\d%_.~+]*)*" + // Optional Path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // Optional Query String
      "(\\#[-a-z\\d_]*)?$", // Optional Fragment
      "i"
    );

   
    if (!urlPattern.test(formattedUrl)) {
      setFormData((prev) => ({ ...prev, isLinkDead: true }));
      setIsLinkVerified(false);
      showPostErrorToast("Please enter a valid URL");
      return; // Backend call skipped!
    }

   
    setFormData((prev) => ({ ...prev, projectUrl: formattedUrl }));
    setVerifyingLink(true);

    try {
      const res = await API.post(
        "/posts/verify-link",
        { url: formattedUrl },
        { withCredentials: true }
      );

   
      const isLive = res.data?.live === true;
      const isDead = !isLive;

      setFormData((prev) => ({
        ...prev,
        isLinkDead: isDead,
        projectUrl: formattedUrl,
      }));

      setIsLinkVerified(isLive);

      if (isDead) {
        showPostErrorToast("Link is dead or completely unreachable.");
      }
    } catch (error) {
      console.error("Link Verification Error:", error);
      setFormData((prev) => ({ ...prev, isLinkDead: true }));
      setIsLinkVerified(false);
      showPostErrorToast("Link verification failed. Please check URL.");
    } finally {
      setVerifyingLink(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 3) {
      alert("Maximum 3 images allowed!");
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index) => {
    const updated = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: updated }));
  };

  // Form Validation Logic aligned with Spring Boot backend validations
  const isFormValid =
    formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    isLinkVerified &&
    !formData.isLinkDead &&
    !verifyingLink &&
    formData.images.length >= 1; 


  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("projectUrl", formData.projectUrl.trim());
      data.append("tags", formData.tags.trim());

     
      formData.images.forEach((file) => {
        data.append("files", file);
      });

    
      const response = await API.post("/posts/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.status === 201 || response.status === 200) {
        useAuthStore.getState().updatePostCountLocally();
        showPostSuccessToast(formData.title);
        setShowPreview(false);
        onClose();
      }
    } catch (error) {
      showPostErrorToast(
        error.response?.data?.message || "Project Drop failed!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Dialog Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider">
              Drop Your Project
            </h2>
            <p className="text-[10px] text-blue-100 font-medium">
              Share your live build link with the community
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Input Form Fields */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="relative">
            <Type className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Project Name (e.g. HotDrop)"
              value={formData.title}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="relative">
            <AlignLeft className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <textarea
              placeholder="Short project overview & key features..."
              value={formData.description}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 h-24 text-sm font-medium text-slate-800 resize-none outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Target URL & Live Verifier Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="https://yourproject.com"
                value={formData.projectUrl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                onChange={(e) => {
                  setFormData({ ...formData, projectUrl: e.target.value });
                  setIsLinkVerified(false);
                }}
              />
            </div>

            <button
              type="button"
              disabled={verifyingLink || !formData.projectUrl}
              onClick={() => checkUrl(formData.projectUrl)}
              className={`px-3.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-black tracking-wide transition min-w-[110px] justify-center ${
                verifyingLink
                  ? "bg-slate-100 text-slate-400 border-slate-200"
                  : isLinkVerified
                  ? formData.isLinkDead
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
              }`}
            >
              {verifyingLink ? (
                <span className="animate-pulse italic">Verifying...</span>
              ) : isLinkVerified ? (
                <>
                  {formData.isLinkDead ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {formData.isLinkDead ? "DEAD" : "LIVE"}
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  VERIFY LINK
                </>
              )}
            </button>
          </div>

          {/* Tags */}
          <div className="relative">
            <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="React, Tailwind, Spring Boot..."
              value={formData.tags}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>

          {/* Image Upload Zone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Screenshots <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                {formData.images.length}/3 Uploaded
              </span>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              {formData.images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm group"
                >
                  <img
                    src={URL.createObjectURL(img)}
                    className="w-full h-full object-cover"
                    alt="preview"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {formData.images.length < 3 && (
                <label className="w-20 h-16 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <ImagePlus className="h-5 w-5 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 mt-1">
                    Add Image
                  </span>
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              At least 1 image required. Max file size: 6MB.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            disabled={!isFormValid}
            onClick={() => setShowPreview(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
              isFormValid
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Preview <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Confirmation Modal */}
      <PostPreview
        isOpen={showPreview}
        data={formData}
        onClose={() => setShowPreview(false)}
        onConfirm={handleFinalSubmit}
        loading={loading}
      />
    </div>
  );
};

export default CreatePost;