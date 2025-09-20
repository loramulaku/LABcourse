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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-base font-semibold text-white/90">
          Personal Information
        </h4>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder-white/40 focus:border-white/20"
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
                className="mt-2 block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm hover:file:bg-white/20"
              />
              <p className="mt-1 text-xs text-white/50">
                Nëse nuk zgjidhni foto, do të përdoret fotoja default:{" "}
                <code>/uploads/avatars/default.png</code>
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
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
      <div className="text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>
      <div className="mt-1 text-sm text-white/90">{value}</div>
    </div>
  );
}

function Label({ children }) {
  return <label className="text-sm text-white/80">{children}</label>;
}

function Input({ label, ...props }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder-white/40 focus:border-white/20 disabled:opacity-50"
      />
    </div>
  );
}
