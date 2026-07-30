import {
  Loader2,
  User,
  AtSign,
  AlignLeft,
  Camera,
  Globe,
  Code2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

// Safe SVG Brands
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

// Helper for prepending https if missing
const normalizeUrl = (url) => {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// URL Regular Expressions
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/i;
const GITHUB_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i;
const LINKEDIN_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/i;
const LEETCODE_REGEX = /^(https?:\/\/)?(www\.)?leetcode\.com\/(u\/)?[a-zA-Z0-9_-]+\/?$/i;

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
    : user?.profileImageUrl || null;

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
    // Clear field-specific error as user types
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

  // Validate Link Patterns
  const validateForm = () => {
    const newErrors = {};

    if (formData.githubUrl && formData.githubUrl.trim()) {
      const url = normalizeUrl(formData.githubUrl);
      if (!GITHUB_REGEX.test(url)) {
        newErrors.githubUrl = "Invalid GitHub link (e.g. github.com/username)";
      }
    }

    if (formData.linkedinUrl && formData.linkedinUrl.trim()) {
      const url = normalizeUrl(formData.linkedinUrl);
      if (!LINKEDIN_REGEX.test(url)) {
        newErrors.linkedinUrl = "Invalid LinkedIn link (e.g. linkedin.com/in/username)";
      }
    }

    if (formData.leetcodeUrl && formData.leetcodeUrl.trim()) {
      const url = normalizeUrl(formData.leetcodeUrl);
      if (!LEETCODE_REGEX.test(url)) {
        newErrors.leetcodeUrl = "Invalid LeetCode link (e.g. leetcode.com/u/username)";
      }
    }

    if (formData.portfolioUrl && formData.portfolioUrl.trim()) {
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
    `w-full border rounded-lg px-4 py-2.5 text-sm text-black outline-none transition-all bg-white ${
      errors[fieldName]
        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
        : "border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-red-500 transition"
          >
            Cancel
          </button>
          <h2 className="text-base font-bold text-slate-800">Edit Profile</h2>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Done"}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative group w-28 h-28">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={48} />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Camera size={24} className="text-white" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field icon={<User size={14} />} label="First Name">
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={getInputClasses("firstName")}
                />
              </Field>
              <Field icon={<User size={14} />} label="Last Name">
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={getInputClasses("lastName")}
                />
              </Field>
            </div>

            <Field icon={<AtSign size={14} />} label="Hotdrop ID">
              <input
                name="hotdropId"
                value={formData.hotdropId}
                onChange={handleChange}
                className={getInputClasses("hotdropId")}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                icon={<Github size={14} />}
                label="GitHub URL"
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
                icon={<Linkedin size={14} />}
                label="LinkedIn URL"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                icon={<Code2 size={14} />}
                label="LeetCode URL"
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
                icon={<Globe size={14} />}
                label="Portfolio URL"
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

            <Field icon={<AlignLeft size={14} />} label="Biography">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={`${getInputClasses("bio")} h-28 resize-none`}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ icon, label, children, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 ml-1">
      <span className="text-slate-500">{icon}</span> {label}
    </label>
    {children}
    {error && (
      <span className="text-[10px] text-red-500 font-medium flex items-center gap-1 ml-1 mt-0.5">
        <AlertCircle size={10} /> {error}
      </span>
    )}
  </div>
);

export default EditProfileModal;