import React, { useState, useCallback } from 'react'
import UploadScreen from './components/UploadScreen'
import EditorScreen from './components/EditorScreen'
import ProcessingScreen from './components/ProcessingScreen'
import api from './api'

function App() {
  const [screen, setScreen] = useState('upload') // upload, processing, editor
  const [projectId, setProjectId] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = useCallback(async (files, silenceThreshold) => {
    setError(null)
    setScreen('processing')
    
    try {
      // Upload files
      const uploadResult = await api.uploadVideos(files)
      setProjectId(uploadResult.project_id)
      
      // Analyze video
      const analyzeResult = await api.analyzeVideo(
        uploadResult.project_id, 
        silenceThreshold
      )
      
      setProjectData(analyzeResult)
      setScreen('editor')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed')
      setScreen('upload')
    }
  }, [])

  const handleExport = useCallback(async (segments) => {
    setError(null)
    setScreen('processing')
    
    try {
      // Update segments
      await api.updateSegments(projectId, segments)
      
      // Export video
      const result = await api.exportVideo(projectId)
      
      // Trigger download using the proper URL
      const downloadUrl = api.getDownloadUrl(result.download_url)
      window.open(downloadUrl, '_blank')
      
      // Reset to upload screen after short delay
      setTimeout(() => {
        setScreen('upload')
        setProjectId(null)
        setProjectData(null)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Export failed')
      setScreen('editor')
    }
  }, [projectId])

  const handleReset = useCallback(() => {
    if (projectId) {
      api.deleteProject(projectId).catch(() => {})
    }
    setScreen('upload')
    setProjectId(null)
    setProjectData(null)
    setError(null)
  }, [projectId])

  return (
    <div className="min-h-screen bg-gray-950">
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500/90 text-white px-4 py-3 text-center text-sm z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {screen === 'upload' && (
        <UploadScreen onUpload={handleUpload} />
      )}
      
      {screen === 'processing' && (
        <ProcessingScreen />
      )}
      
      {screen === 'editor' && projectData && (
        <EditorScreen 
          projectData={projectData}
          onExport={handleExport}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
