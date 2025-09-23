//C:\ProjektiLab\frontend\src\dashboard\components\AdminProfile\UserInfoCard.jsx
import React, { useState } from "react";

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-[#0f172a] p-6 text-white shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function UserInfoCard({ name, email, profile, onSave }) {
  const [open, setOpen] = useState(false);

  // form state
  const [form, setForm] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    facebook: profile.facebook || "",
    x: profile.x || "",
    linkedin: profile.linkedin || "",
    instagram: profile.instagram || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await onSave(form, avatarFile);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-semibold text-foreground">
          Personal Information
        </h4>
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Info label="First Name" value={profile.first_name || "-"} />
        <Info label="Last Name" value={profile.last_name || "-"} />
        <Info label="Email address" value={email || "-"} />
        <Info label="Phone" value={profile.phone || "-"} />
        <Info label="Bio" value={profile.bio || "-"} full />
      </div>

      {/* Modal për editim si në foto 2 */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Personal Information"
      >
        <form onSubmit={submit} className="space-y-5">
          {/* Socials */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Facebook"
              name="facebook"
              value={form.facebook}
              onChange={onChange}
              placeholder="https://www.facebook.com/..."
            />
            <Input
              label="X.com"
              name="x"
              value={form.x}
              onChange={onChange}
              placeholder="https://x.com/..."
            />
            <Input
              label="Linkedin"
              name="linkedin"
              value={form.linkedin}
              onChange={onChange}
              placeholder="https://linkedin.com/..."
            />
            <Input
              label="Instagram"
              name="instagram"
              value={form.instagram}
              onChange={onChange}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="h-px w-full bg-white/10" />

          {/* Personal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
            />
            <Input
              label="Last Name"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
            />
            <Input label="Email Address (nga token)" value={email} readOnly />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
            />
          </div>

          <div>
            <Label>Bio</Label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows={3}
              className="mt-2 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Team Manager"
            />
          </div>

          {/* Avatar */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label>Avatar</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full cursor-pointer p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-blue-600"
              />
              <p className="mt-1 text-xs text-white/50">
                Nëse nuk zgjidhni foto, do të përdoret fotoja default:{" "}
                <code>/uploads/avatars/default.png</code>
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Info({ label, value, full }) {
  return (
    <div className={`${full ? "sm:col-span-2" : ""}`}>
      <div className="text-sm font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-base text-foreground">{value}</div>
    </div>
  );
}

function Label({ children }) {
  return <label className="text-sm font-medium text-foreground">{children}</label>;
}

function Input({ label, ...props }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className="mt-2 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}
