//C:\ProjektiLab\frontend\src\dashboard\components\AdminProfile\UserMetaCard.jsx
import React from "react";

export default function UserMetaCard({ name, email, roleLabel, avatarUrl, socials, onAvatarError }) {
  const SocialIcon = ({ href, src, alt }) => (
    <a
      href={href || "#"}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition
        ${href ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed"}`}
      aria-label={alt}
    >
      <img src={src} alt={alt} className="h-5 w-5" />
    </a>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10"
              onError={onAvatarError || ((e) => {
                e.target.src = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/avatars/default.png`;
              })}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-white/90">{name || "-"}</div>
            <div className="text-xs text-white/60">{roleLabel}</div>
            <div className="mt-1 text-xs text-white/60">{email || "-"}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SocialIcon href={socials.facebook} src="/social/facebook.jpg" alt="Facebook" />
          <SocialIcon href={socials.x}         src="/social/x.jpg"         alt="X" />
          <SocialIcon href={socials.linkedin}  src="/social/linkedin.jpg"  alt="LinkedIn" />
          <SocialIcon href={socials.instagram} src="/social/instagram.jpg" alt="Instagram" />
        </div>
      </div>
    </div>
  );
}
