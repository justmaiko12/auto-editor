import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Download, Play, Pause, RotateCcw } from 'lucide-react'
import Timeline from './Timeline'
import Transcript from './Transcript'

function EditorScreen({ projectData, onExport, onReset }) {
  const [segments, setSegments] = useState(projectData.segments || [])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline') // timeline, transcript
  const videoRef = useRef(null)

  // Calculate stats
  const totalDuration = projectData.duration || 0
  const keptDuration = segments
    .filter(s => s.keep)
    .reduce((acc, s) => acc + (s.end - s.start), 0)
  const removedDuration = totalDuration - keptDuration

  // Update video time display
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    
    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => video.removeEventListener('timeupdate', handleTimeUpdate)
  }, [])

  const toggleSegment = useCallback((index) => {
    setSegments(prev => prev.map((seg, i) => 
      i === index ? { ...seg, keep: !seg.keep } : seg
    ))
  }, [])

  const toggleWordRange = useCallback((startTime, endTime) => {
    // Toggle all segments within the time range
    setSegments(prev => prev.map(seg => {
      if (seg.start >= startTime && seg.end <= endTime) {
        return { ...seg, keep: !seg.keep }
      }
      return seg
    }))
  }, [])

  const seekTo = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const togglePlayback = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const resetEdits = useCallback(() => {
    setSegments(projectData.segments || [])
  }, [projectData.segments])

  const handleExport = useCallback(() => {
    onExport(segments)
  }, [segments, onExport])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button 
          onClick={onReset}
          className="p-2 -ml-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Edit Video</h1>
        <button 
          onClick={resetEdits}
          className="p-2 -mr-2 text-gray-400 hover:text-white"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      {/* Video Preview - placeholder since we don't have actual video URL */}
      <div className="relative bg-black aspect-video">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <Play className="w-8 h-8 text-gray-500 ml-1" />
            </div>
            <p className="text-gray-500 text-sm">Preview not available</p>
            <p className="text-gray-600 text-xs mt-1">Edit in timeline below</p>
          </div>
        </div>
        
        {/* Playback controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-around py-3 bg-gray-900 border-b border-gray-800 text-center">
        <div>
          <p className="text-green-400 font-semibold">{formatTime(keptDuration)}</p>
          <p className="text-gray-500 text-xs">Keeping</p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div>
          <p className="text-red-400 font-semibold">{formatTime(removedDuration)}</p>
          <p className="text-gray-500 text-xs">Removing</p>
        </div>
        <div className="w-px h-8 bg-gray-700" />
        <div>
          <p className="text-primary-400 font-semibold">
            {Math.round((keptDuration / totalDuration) * 100)}%
          </p>
          <p className="text-gray-500 text-xs">Final</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'timeline' 
              ? 'text-primary-400 border-b-2 border-primary-400' 
              : 'text-gray-400'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'transcript' 
              ? 'text-primary-400 border-b-2 border-primary-400' 
              : 'text-gray-400'
          }`}
        >
          Transcript
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'timeline' ? (
          <Timeline
            segments={segments}
            duration={totalDuration}
            currentTime={currentTime}
            onToggleSegment={toggleSegment}
            onSeek={seekTo}
          />
        ) : (
          <Transcript
            transcript={projectData.transcript || []}
            segments={segments}
            currentTime={currentTime}
            onToggleRange={toggleWordRange}
            onSeek={seekTo}
          />
        )}
      </div>

      {/* Export button */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <button
          onClick={handleExport}
          className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Download className="w-5 h-5" />
          Export Video
        </button>
      </div>
    </div>
  )
}

export default EditorScreen
