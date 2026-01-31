import React, { useState, useRef, useCallback } from 'react'
import { Upload, Video, Settings, ChevronDown, ChevronUp } from 'lucide-react'

function UploadScreen({ onUpload }) {
  const [files, setFiles] = useState([])
  const [silenceThreshold, setSilenceThreshold] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFiles = useCallback((newFiles) => {
    const videoFiles = Array.from(newFiles).filter(
      file => file.type.startsWith('video/')
    )
    setFiles(prev => [...prev, ...videoFiles])
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(() => {
    if (files.length > 0) {
      onUpload(files, silenceThreshold)
    }
  }, [files, silenceThreshold, onUpload])

  return (
    <div className="min-h-screen flex flex-col p-4 pb-8">
      {/* Header */}
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-white">Auto Editor</h1>
        <p className="text-gray-400 text-sm mt-1">
          Remove dead space automatically
        </p>
      </header>

      {/* Upload Area */}
      <div 
        className={`
          flex-1 flex flex-col items-center justify-center
          border-2 border-dashed rounded-2xl
          transition-all duration-200 min-h-[300px]
          ${isDragging 
            ? 'border-primary-400 bg-primary-500/10' 
            : 'border-gray-700 bg-gray-900/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {files.length === 0 ? (
          <>
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-white font-medium">Tap to upload videos</p>
            <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
          </>
        ) : (
          <div className="w-full px-4 space-y-2 max-h-[400px] overflow-y-auto hide-scrollbar">
            {files.map((file, index) => (
              <div 
                key={index}
                className="flex items-center bg-gray-800 rounded-xl p-3 gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-400 p-2"
                >
                  ×
                </button>
              </div>
            ))}
            
            <button
              className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              + Add more videos
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="mt-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between w-full bg-gray-900 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-white text-sm">Silence Detection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-400 text-sm font-medium">
              {silenceThreshold}s
            </span>
            {showSettings ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {showSettings && (
          <div className="bg-gray-900 rounded-xl px-4 py-4 mt-2">
            <p className="text-gray-400 text-xs mb-3">
              Remove silence longer than:
            </p>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={silenceThreshold}
              onChange={(e) => setSilenceThreshold(parseFloat(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5s</span>
              <span>1.0s</span>
              <span>1.5s</span>
              <span>2.0s</span>
            </div>
          </div>
        )}
      </div>

      {/* Process Button */}
      <button
        onClick={handleSubmit}
        disabled={files.length === 0}
        className={`
          mt-4 py-4 rounded-2xl font-semibold text-lg
          transition-all duration-200
          ${files.length > 0
            ? 'bg-primary-500 text-white active:scale-[0.98]'
            : 'bg-gray-800 text-gray-500'
          }
        `}
      >
        {files.length === 0 
          ? 'Select videos to continue'
          : `Process ${files.length} video${files.length > 1 ? 's' : ''}`
        }
      </button>
    </div>
  )
}

export default UploadScreen
