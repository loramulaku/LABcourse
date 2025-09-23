//C:\ProjektiLab\frontend\src\dashboard\components\AdminProfile\UserMetaCard.jsx
import React from "react";

export default function UserMetaCard({
  name,
  email,
  roleLabel,
  avatarUrl,
  socials,
  onAvatarError,
}) {
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
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-16 w-16 rounded-full object-cover ring-4 ring-gradient-to-r from-blue-500 to-purple-600"
              onError={
                onAvatarError ||
                ((e) => {
                  e.target.src = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/avatars/default.png`;
                })
              }
            />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {name || "-"}
            </div>
            <div className="text-sm text-muted-foreground">{roleLabel}</div>
            <div className="mt-1 text-sm text-muted-foreground">{email || "-"}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SocialIcon
            href={socials.facebook}
            src="/social/facebook.jpg"
            alt="Facebook"
          />
          <SocialIcon href={socials.x} src="/social/x.jpg" alt="X" />
          <SocialIcon
            href={socials.linkedin}
            src="/social/linkedin.jpg"
            alt="LinkedIn"
          />
          <SocialIcon
            href={socials.instagram}
            src="/social/instagram.jpg"
            alt="Instagram"
          />
        </div>
      </div>
    </div>
  );
}
