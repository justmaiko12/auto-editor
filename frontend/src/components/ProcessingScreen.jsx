import React from 'react'

function ProcessingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Animated loader */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin" />
      </div>
      
      <h2 className="text-xl font-semibold text-white mb-2">
        Processing your video
      </h2>
      
      <p className="text-gray-400 text-center text-sm max-w-xs">
        Analyzing audio, generating transcript, and detecting silence...
      </p>
      
      {/* Progress steps */}
      <div className="mt-8 space-y-3 w-full max-w-xs">
        <ProcessingStep label="Uploading video" done />
        <ProcessingStep label="Analyzing audio" active />
        <ProcessingStep label="Generating transcript" />
        <ProcessingStep label="Detecting silence" />
      </div>
    </div>
  )
}

function ProcessingStep({ label, done, active }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
        ${done ? 'bg-green-500' : active ? 'bg-primary-500' : 'bg-gray-700'}
      `}>
        {done ? (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : active ? (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        ) : (
          <div className="w-2 h-2 bg-gray-500 rounded-full" />
        )}
      </div>
      <span className={`text-sm ${done || active ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}

export default ProcessingScreen
