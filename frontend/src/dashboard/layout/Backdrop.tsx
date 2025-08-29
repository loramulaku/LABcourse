// src/components/layout/Backdrop.tsx
import React from "react";

interface BackdropProps {
  onClick?: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
      onClick={onClick}
    />
  );
};

export default Backdrop;
