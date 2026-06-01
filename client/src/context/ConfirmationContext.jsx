import React, { createContext, useContext, useState } from 'react';

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    isAlert: false,
    resolve: null
  });

  const confirm = (message, isAlert = false) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        message,
        isAlert,
        resolve
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState({ isOpen: false, message: '', isAlert: false, resolve: null });
  };

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({ isOpen: false, message: '', isAlert: false, resolve: null });
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-slate-800 animate-slide-up shadow-2xl text-left bg-slate-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] animate-pulse-gold" />
              <span>{modalState.isAlert ? 'Notification' : 'Confirm Action'}</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-6 font-medium">
              {modalState.message}
            </p>
            <div className="flex gap-3 justify-end">
              {!modalState.isAlert && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="btn-gold-grad px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {modalState.isAlert ? 'OK' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  return useContext(ConfirmationContext);
}
