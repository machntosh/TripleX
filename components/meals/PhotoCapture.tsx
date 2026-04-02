"use client";

import { useRef } from "react";
import { Camera, ImageIcon } from "lucide-react";

interface Props {
  onPhoto: (base64: string, mimeType: string, preview: string) => void;
}

function compressForApi(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
      else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, 0.8);
      resolve({ base64: dataUrl.split(",")[1], mimeType, preview: dataUrl });
    };

    img.onerror = reject;
    img.src = url;
  });
}

export default function PhotoCapture({ onPhoto }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const result = await compressForApi(file);
      onPhoto(result.base64, result.mimeType, result.preview);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        onPhoto(data.split(",")[1], file.type || "image/jpeg", data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => cameraRef.current?.click()}
        className="flex-1 flex flex-col items-center justify-center gap-2 bg-teal-600 text-white rounded-2xl py-6 active:bg-teal-700 transition-colors">
        <Camera size={32} />
        <span className="text-sm font-semibold">Prendre une photo</span>
      </button>
      <button type="button" onClick={() => galleryRef.current?.click()}
        className="flex-1 flex flex-col items-center justify-center gap-2 bg-white text-slate-600 rounded-2xl py-6 border-2 border-slate-200 active:bg-slate-50 transition-colors">
        <ImageIcon size={32} />
        <span className="text-sm font-semibold">Choisir une photo</span>
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
