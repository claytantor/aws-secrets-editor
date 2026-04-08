import { useState, useRef } from 'react'
import EntryRow from './EntryRow.jsx'

const NAME_WIDTH_MIN = 80
const NAME_WIDTH_MAX = 480
const NAME_WIDTH_DEFAULT = 260

export default function EntryTable({ entries, baseline, onUpdate, onDelete }) {
  const [expandedName, setExpandedName] = useState(null)
  const [nameWidth, setNameWidth] = useState(NAME_WIDTH_DEFAULT)
  const dragStart = useRef(null)

  function onResizeMouseDown(e) {
    e.preventDefault()
    dragStart.current = { x: e.clientX, width: nameWidth }

    function onMouseMove(e) {
      const delta = e.clientX - dragStart.current.x
      setNameWidth(Math.max(NAME_WIDTH_MIN, Math.min(NAME_WIDTH_MAX, dragStart.current.width + delta)))
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      dragStart.current = null
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const cols = `${nameWidth}px 1fr 40px`

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="mx-auto w-12 h-12 mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No entries found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      {/* Table header */}
      <div className="grid bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400 uppercase tracking-wider"
        style={{ gridTemplateColumns: cols }}>
        <div className="relative flex items-center px-3 py-2 select-none">
          Key
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group/handle flex items-center justify-center"
            title="Drag to resize"
          >
            <div className="w-px h-3 bg-gray-700 group-hover/handle:bg-blue-500 transition-colors" />
          </div>
        </div>
        <div className="px-3 py-2">Value</div>
        <div className="px-3 py-2" />
      </div>

      <div className="divide-y divide-gray-800/60">
        {entries.map(([name, value]) => (
          <EntryRow
            key={name}
            name={name}
            value={value}
            baseValue={baseline[name]}
            isNew={!(name in baseline)}
            isExpanded={expandedName === name}
            nameWidth={nameWidth}
            onExpand={() => setExpandedName(name)}
            onCollapse={() => setExpandedName(null)}
            onUpdate={(val) => onUpdate(name, val)}
            onDelete={() => onDelete(name)}
          />
        ))}
      </div>
    </div>
  )
}
