export default function ConfirmDialog({ message, confirmLabel = 'Elimina', cancelLabel = 'Annulla', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-gray-100" onClick={onCancel}>{cancelLabel}</button>
          <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
