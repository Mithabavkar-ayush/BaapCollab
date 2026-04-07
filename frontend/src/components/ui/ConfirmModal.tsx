"use client";

import React, { useEffect, useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "primary" | "danger" | "warning";
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "primary",
}: ConfirmModalProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered && !isOpen) return null;

  const themes = {
    primary: "bg-[#4F46E5] hover:bg-[#433fd1] shadow-indigo-100",
    danger: "bg-red-500 hover:bg-red-600 shadow-red-100",
    warning: "bg-orange-500 hover:bg-orange-600 shadow-orange-100",
  };

  const icons = {
    primary: (
      <svg className="w-8 h-8 text-[#4F46E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    danger: (
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all"
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className={`relative bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl transition-all duration-200 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${variant === 'primary' ? 'bg-indigo-50' : variant === 'danger' ? 'bg-red-50' : 'bg-orange-50'}`}>
          {icons[variant]}
        </div>
        
        <h3 className="text-xl font-black text-gray-900 text-center mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed font-medium">
          {description}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm active:scale-95"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl transition-all text-sm shadow-lg active:scale-95 ${themes[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
