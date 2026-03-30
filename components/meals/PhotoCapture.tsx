"use client";

import { useRef } from "react";
import { Camera, ImageIcon } from "lucide-react";

interface Props {
  onPhoto: (base64: string, mimeType: string, preview: string) => void;
}

export default function PhotoCapture({ onPhoto }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const mimeType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // result is "data:image/jpeg;base64,XXXX"
      const base64 = result.split(",")[1];
      onPhoto(base64, mimeType, result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-3">
      {/* Camera */}
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="flex-1 flex flex-col items-center justify-center gap-2 bg-teal-600 text-white rounded-2xl py-6 active:bg-teal-700 transition-colors"
      >
        <Camera size={32} />
        <span className="text-sm font-semibold">Prendre une photo</span>
      </button>

      {/* Gallery */}
      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className="flex-1 flex flex-col items-center justify-center gap-2 bg-white text-slate-600 rounded-2xl py-6 border-2 border-slate-200 active:bg-slate-50 transition-colors"
      >
        <ImageIcon size={32} />
        <span className="text-sm font-semibold">Choisir une photo</span>
      </button>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
