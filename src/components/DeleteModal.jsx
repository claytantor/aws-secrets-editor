export default function DeleteModal({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-9 h-9 bg-red-500/15 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 mb-1">Delete entry</h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to delete{' '}
              <span className="font-mono text-gray-200 bg-gray-800 px-1 rounded">{name}</span>?
              This change will be applied when you save.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
