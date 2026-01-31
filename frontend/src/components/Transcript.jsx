import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

function Transcript({ transcript, segments, currentTime, onToggleRange, onSeek }) {
  const [selectionStart, setSelectionStart] = useState(null)
  const [selectionEnd, setSelectionEnd] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const containerRef = useRef(null)

  // Create a map of removed time ranges
  const removedRanges = segments
    .filter(s => !s.keep)
    .map(s => ({ start: s.start, end: s.end }))

  const isWordRemoved = useCallback((start, end) => {
    return removedRanges.some(
      range => start >= range.start && end <= range.end
    )
  }, [removedRanges])

  const isWordPlaying = useCallback((start, end) => {
    return currentTime >= start && currentTime <= end
  }, [currentTime])

  const handleWordClick = useCallback((word, e) => {
    if (isSelecting) return
    
    // Single tap - seek to word
    onSeek(word.start)
  }, [isSelecting, onSeek])

  const handleWordLongPress = useCallback((word) => {
    setIsSelecting(true)
    setSelectionStart(word)
    setSelectionEnd(word)
  }, [])

  const handleWordHover = useCallback((word) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd(word)
    }
  }, [isSelecting, selectionStart])

  const handleSelectionEnd = useCallback(() => {
    if (selectionStart && selectionEnd) {
      const start = Math.min(selectionStart.start, selectionEnd.start)
      const end = Math.max(selectionStart.end, selectionEnd.end)
      onToggleRange(start, end)
    }
    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }, [selectionStart, selectionEnd, onToggleRange])

  const isWordInSelection = useCallback((word) => {
    if (!selectionStart || !selectionEnd) return false
    
    const start = Math.min(selectionStart.start, selectionEnd.start)
    const end = Math.max(selectionStart.end, selectionEnd.end)
    
    return word.start >= start && word.end <= end
  }, [selectionStart, selectionEnd])

  // Touch handlers for long press
  const touchTimer = useRef(null)
  
  const handleTouchStart = useCallback((word) => {
    touchTimer.current = setTimeout(() => {
      handleWordLongPress(word)
    }, 500)
  }, [handleWordLongPress])

  const handleTouchEnd = useCallback(() => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
    }
    if (isSelecting) {
      handleSelectionEnd()
    }
  }, [isSelecting, handleSelectionEnd])

  const handleTouchMove = useCallback((e) => {
    if (!isSelecting) return
    
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    
    if (element?.dataset?.wordIndex) {
      const index = parseInt(element.dataset.wordIndex)
      const word = transcript[index]
      if (word) {
        setSelectionEnd(word)
      }
    }
  }, [isSelecting, transcript])

  // Cancel selection on scroll
  useEffect(() => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Instructions */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800">
        <p className="text-gray-400 text-xs">
          Tap a word to seek • Long press & drag to select • Selected text will be removed
        </p>
      </div>

      {/* Transcript text */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={isSelecting ? handleSelectionEnd : undefined}
      >
        <div className="text-base leading-relaxed">
          {transcript.map((word, index) => {
            const removed = isWordRemoved(word.start, word.end)
            const playing = isWordPlaying(word.start, word.end)
            const inSelection = isWordInSelection(word)
            
            return (
              <span
                key={index}
                data-word-index={index}
                className={`
                  word inline
                  ${removed ? 'word-selected line-through' : ''}
                  ${playing ? 'word-playing' : ''}
                  ${inSelection ? 'bg-primary-500/40' : ''}
                `}
                onClick={(e) => handleWordClick(word, e)}
                onTouchStart={() => handleTouchStart(word)}
                onMouseDown={() => handleWordLongPress(word)}
                onMouseEnter={() => handleWordHover(word)}
              >
                {word.text}{' '}
              </span>
            )
          })}
        </div>

        {transcript.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No transcript available</p>
            <p className="text-gray-600 text-sm mt-1">
              Use the timeline view to edit segments
            </p>
          </div>
        )}
      </div>

      {/* Selection action bar */}
      {isSelecting && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 font-medium text-sm">
                {selectionStart && selectionEnd ? (
                  `Selected ${Math.abs(
                    transcript.indexOf(selectionEnd) - transcript.indexOf(selectionStart)
                  ) + 1} words`
                ) : (
                  'Drag to select'
                )}
              </p>
              <p className="text-red-400/60 text-xs">Release to remove from video</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsSelecting(false)
                  setSelectionStart(null)
                  setSelectionEnd(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectionEnd}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transcript
