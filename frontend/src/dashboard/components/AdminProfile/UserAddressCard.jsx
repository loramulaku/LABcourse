//frontend/src/dashboard/components/AdminProfile/UserAddressCard.jsx
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

export default function UserAddressCard({ profile, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    country: profile.country || "",
    city_state: profile.city_state || "",
    postal_code: profile.postal_code || "",
    tax_id: profile.tax_id || "",
  });

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-base font-semibold text-white/90">Address</h4>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Info label="Country" value={profile.country || "-"} />
        <Info label="City/State" value={profile.city_state || "-"} />
        <Info label="Postal Code" value={profile.postal_code || "-"} />
        <Info label="TAX ID" value={profile.tax_id || "-"} />
      </div>

      {/* Modal për Address */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Address">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={onChange}
            />
            <Input
              label="City/State"
              name="city_state"
              value={form.city_state}
              onChange={onChange}
            />
            <Input
              label="Postal Code"
              name="postal_code"
              value={form.postal_code}
              onChange={onChange}
            />
            <Input
              label="TAX ID"
              name="tax_id"
              value={form.tax_id}
              onChange={onChange}
            />
          </div>

          <div className="flex justify-end">
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

function Info({ label, value }) {
  return (
    <div>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder-white/40 focus:border-white/20"
      />
    </div>
  );
}
