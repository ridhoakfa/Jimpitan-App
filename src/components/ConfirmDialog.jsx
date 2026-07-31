import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  variant = 'danger', // 'danger', 'warning', 'info'
  title = 'Konfirmasi',
  subtitle = '',
  message = 'Apakah Anda yakin?',
  additionalInfo = '',
  confirmText = 'Ya',
  cancelText = 'Batal',
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Auto-focus confirm button
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Styling based on variant
  const variantColors = {
    danger: {
      header: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
      icon: 'text-red-500 dark:text-red-400',
      confirmButton: 'bg-red-500 hover:bg-red-600 focus:ring-red-400',
    },
    warning: {
      header: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500 dark:text-yellow-400',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
    },
    info: {
      header: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500 dark:text-blue-400',
      confirmButton: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400',
    },
  };

  const colors = variantColors[variant] || variantColors.danger;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-up border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.header}`}>
          <div className="flex items-center gap-3">
            {/* Icon based on variant */}
            <div className={`text-2xl ${colors.icon}`}>
              {variant === 'danger' && '⚠️'}
              {variant === 'warning' && '⚡'}
              {variant === 'info' && 'ℹ️'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 text-base">
            {message}
          </p>
          {additionalInfo && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
              {additionalInfo}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-2 justify-end border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}