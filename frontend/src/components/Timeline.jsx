import React, { useRef, useCallback, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

function Timeline({ segments, duration, currentTime, onToggleSegment, onSeek }) {
  const timelineRef = useRef(null)
  const [scale, setScale] = useState(1)
  
  // Calculate timeline width based on duration and scale
  const pixelsPerSecond = 50 * scale
  const timelineWidth = Math.max(duration * pixelsPerSecond, 300)
  
  const handleTimelineClick = useCallback((e) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft
    const time = x / pixelsPerSecond
    
    onSeek(Math.max(0, Math.min(time, duration)))
  }, [pixelsPerSecond, duration, onSeek])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Group consecutive segments for better display
  const groupedSegments = groupSegments(segments)

  return (
    <div className="h-full flex flex-col">
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50">
        <span className="text-gray-400 text-xs">Zoom</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="w-8 h-8 rounded-lg bg-gray-800 text-gray-300 text-lg"
          >
            −
          </button>
          <span className="text-gray-400 text-xs w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.25))}
            className="w-8 h-8 rounded-lg bg-gray-800 text-gray-300 text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar"
        onClick={handleTimelineClick}
      >
        <div 
          className="relative h-full min-h-[200px]"
          style={{ width: timelineWidth }}
        >
          {/* Time markers */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-800">
            {Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: i * 5 * pixelsPerSecond }}
              >
                <div className="w-px h-3 bg-gray-600" />
                <span className="text-gray-500 text-[10px] mt-0.5">
                  {formatTime(i * 5)}
                </span>
              </div>
            ))}
          </div>

          {/* Segments */}
          <div className="absolute top-8 left-0 right-0 bottom-0 px-2">
            {groupedSegments.map((segment, index) => (
              <TimelineSegment
                key={index}
                segment={segment}
                pixelsPerSecond={pixelsPerSecond}
                onToggle={() => onToggleSegment(segment.originalIndex)}
              />
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary-400 z-10 pointer-events-none"
            style={{ left: currentTime * pixelsPerSecond }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Segment list */}
      <div className="max-h-[40%] overflow-y-auto border-t border-gray-800">
        <div className="p-2 space-y-1">
          {segments.map((segment, index) => (
            <SegmentListItem
              key={index}
              segment={segment}
              index={index}
              onToggle={() => onToggleSegment(index)}
              onSeek={() => onSeek(segment.start)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineSegment({ segment, pixelsPerSecond, onToggle }) {
  const width = (segment.end - segment.start) * pixelsPerSecond
  const left = segment.start * pixelsPerSecond
  
  return (
    <div
      className={`
        absolute h-12 rounded-lg border-2 cursor-pointer
        transition-all duration-150 flex items-center justify-center
        ${segment.keep
          ? segment.is_silence
            ? 'bg-yellow-500/20 border-yellow-500/50'
            : 'bg-primary-500/30 border-primary-500'
          : 'bg-red-500/20 border-red-500/40 opacity-60'
        }
      `}
      style={{ left, width: Math.max(width, 4), top: segment.is_silence ? 60 : 8 }}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      {width > 30 && (
        segment.is_silence ? (
          <VolumeX className="w-4 h-4 text-yellow-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-primary-400" />
        )
      )}
    </div>
  )
}

function SegmentListItem({ segment, index, onToggle, onSeek }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }

  return (
    <div 
      className={`
        flex items-center gap-3 p-2 rounded-lg transition-colors
        ${segment.keep ? 'bg-gray-800/50' : 'bg-red-500/10'}
      `}
    >
      <button
        onClick={onToggle}
        className={`
          w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0
          ${segment.keep 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
          }
        `}
      >
        {segment.keep ? '✓' : '×'}
      </button>
      
      <div className="flex-1 min-w-0" onClick={onSeek}>
        <p className={`text-sm truncate ${segment.keep ? 'text-white' : 'text-gray-500'}`}>
          {segment.is_silence ? '[Silence]' : segment.text || 'Segment'}
        </p>
        <p className="text-xs text-gray-500">
          {formatTime(segment.start)} — {formatTime(segment.end)}
          <span className="ml-2 text-gray-600">
            ({((segment.end - segment.start)).toFixed(1)}s)
          </span>
        </p>
      </div>
      
      {segment.is_silence && (
        <VolumeX className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
    </div>
  )
}

function groupSegments(segments) {
  return segments.map((seg, index) => ({
    ...seg,
    originalIndex: index
  }))
}

export default Timeline
