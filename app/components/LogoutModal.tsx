'use client'

export default function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#005696] p-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-sign-out-alt text-2xl text-white"></i>
          </div>
          <h3 className="text-white text-lg font-bold">Keluar dari SINEDA?</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-6">Anda akan keluar dari sesi saat ini. Lanjutkan?</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
