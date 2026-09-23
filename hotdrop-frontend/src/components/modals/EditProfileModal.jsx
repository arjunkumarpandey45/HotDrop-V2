import {
  Loader2,
  User,
  AtSign,
  AlignLeft,
  Camera,
  Globe,
  Code2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import dp from "../../assets/dp.jpg";

const Github = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const normalizeUrl = (url) => {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[-\w./?%&=]*)?$/i;
const GITHUB_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/i;
const LINKEDIN_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/i;
const LEETCODE_REGEX = /^(https?:\/\/)?(www\.)?leetcode\.com\/(u\/)?[\w-]+\/?$/i;

function EditProfileModal({ isOpen, onClose, user, handleUpdate, loading }) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    hotdropId: user?.hotdropId || "",
    bio: user?.bio || "",
    githubUrl: user?.githubUrl || "",
    linkedinUrl: user?.linkedinUrl || "",
    leetcodeUrl: user?.leetcodeUrl || "",
    portfolioUrl: user?.portfolioUrl || "",
  });

  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const preview = selectedFile
    ? URL.createObjectURL(selectedFile)
    : user?.profileImageUrl || user?.profilePicture || user?.avatar || dp;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.githubUrl?.trim()) {
      const url = normalizeUrl(formData.githubUrl);
      if (!GITHUB_REGEX.test(url)) {
        newErrors.githubUrl = "Invalid GitHub link (e.g. github.com/username)";
      }
    }

    if (formData.linkedinUrl?.trim()) {
      const url = normalizeUrl(formData.linkedinUrl);
      if (!LINKEDIN_REGEX.test(url)) {
        newErrors.linkedinUrl = "Invalid LinkedIn link (e.g. linkedin.com/in/username)";
      }
    }

    if (formData.leetcodeUrl?.trim()) {
      const url = normalizeUrl(formData.leetcodeUrl);
      if (!LEETCODE_REGEX.test(url)) {
        newErrors.leetcodeUrl = "Invalid LeetCode link (e.g. leetcode.com/u/username)";
      }
    }

    if (formData.portfolioUrl?.trim()) {
      const url = normalizeUrl(formData.portfolioUrl);
      if (!URL_REGEX.test(url)) {
        newErrors.portfolioUrl = "Invalid website or portfolio URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validateForm()) return;

    const data = new FormData();

    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("hotdropId", formData.hotdropId);
    data.append("bio", formData.bio);
    data.append("githubUrl", normalizeUrl(formData.githubUrl));
    data.append("linkedinUrl", normalizeUrl(formData.linkedinUrl));
    data.append("leetcodeUrl", normalizeUrl(formData.leetcodeUrl));
    data.append("portfolioUrl", normalizeUrl(formData.portfolioUrl));

    if (selectedFile) {
      data.append("profilePicture", selectedFile);
    }

    handleUpdate(data);
  };

  const getInputClasses = (fieldName) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white placeholder:text-slate-400 ${
      errors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close edit profile modal"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md border-0 p-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            onClose();
          }
        }}
      />
      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group w-28 h-28">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-slate-100 bg-slate-50 transition-transform duration-300 group-hover:scale-[1.02]">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = dp;
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={44} />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer text-white">
                <Camera size={22} className="mb-0.5" />
                <span className="text-[10px] font-semibold tracking-wide">Change</span>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-xs font-medium text-slate-400">Click picture to update</p>
          </div>

          <div className="space-y-5">

            <div className="grid grid-cols-2 gap-3.5">
              <Field icon={<User size={13} />} label="First Name">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={getInputClasses("firstName")}
                />
              </Field>
              <Field icon={<User size={13} />} label="Last Name">
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={getInputClasses("lastName")}
                />
              </Field>
            </div>

            <Field icon={<AtSign size={13} />} label="HotDrop ID">
              <input
                name="hotdropId"
                value={formData.hotdropId}
                onChange={handleChange}
                className={getInputClasses("hotdropId")}
              />
            </Field>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-blue-500" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Social Links</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field
                  icon={<Github size={13} />}
                  label="GitHub"
                  error={errors.githubUrl}
                >
                  <input
                    name="githubUrl"
                    placeholder="github.com/username"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className={getInputClasses("githubUrl")}
                  />
                </Field>
                <Field
                  icon={<Linkedin size={13} />}
                  label="LinkedIn"
                  error={errors.linkedinUrl}
                >
                  <input
                    name="linkedinUrl"
                    placeholder="linkedin.com/in/username"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className={getInputClasses("linkedinUrl")}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                <Field
                  icon={<Code2 size={13} />}
                  label="LeetCode"
                  error={errors.leetcodeUrl}
                >
                  <input
                    name="leetcodeUrl"
                    placeholder="leetcode.com/u/username"
                    value={formData.leetcodeUrl}
                    onChange={handleChange}
                    className={getInputClasses("leetcodeUrl")}
                  />
                </Field>
                <Field
                  icon={<Globe size={13} />}
                  label="Portfolio Website"
                  error={errors.portfolioUrl}
                >
                  <input
                    name="portfolioUrl"
                    placeholder="yourportfolio.com"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    className={getInputClasses("portfolioUrl")}
                  />
                </Field>
              </div>
            </div>

            <Field icon={<AlignLeft size={13} />} label="Biography">
              <textarea
                name="bio"
                placeholder="Tell the community about yourself..."
                value={formData.bio}
                onChange={handleChange}
                className={`${getInputClasses("bio")} h-28 resize-none leading-relaxed`}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ icon, label, children, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 ml-0.5">
      <span className="text-slate-400">{icon}</span> {label}
    </label>
    {children}
    {error && (
      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 ml-0.5 mt-0.5">
        <AlertCircle size={12} /> {error}
      </span>
    )}
  </div>
);

export default EditProfileModal;
