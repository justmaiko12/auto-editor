import axios from 'axios'

// Use environment variable for API URL, fallback to relative path for local dev
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = {
  async uploadVideos(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Increase timeout for large uploads
      timeout: 300000 // 5 minutes
    })
    
    return response.data
  },
  
  async analyzeVideo(projectId, silenceThreshold = 1.0) {
    const response = await axios.post(
      `${API_BASE}/analyze/${projectId}?silence_threshold=${silenceThreshold}`,
      {},
      { timeout: 600000 } // 10 minutes for transcription
    )
    return response.data
  },
  
  async updateSegments(projectId, segments) {
    const response = await axios.post(`${API_BASE}/edit`, {
      project_id: projectId,
      segments: segments
    })
    return response.data
  },
  
  async exportVideo(projectId) {
    const response = await axios.post(
      `${API_BASE}/export/${projectId}`,
      {},
      { timeout: 600000 } // 10 minutes for export
    )
    return response.data
  },
  
  async getProject(projectId) {
    const response = await axios.get(`${API_BASE}/project/${projectId}`)
    return response.data
  },
  
  async deleteProject(projectId) {
    const response = await axios.delete(`${API_BASE}/project/${projectId}`)
    return response.data
  },
  
  getDownloadUrl(downloadPath) {
    // Handle both relative and absolute URLs
    if (downloadPath.startsWith('http')) {
      return downloadPath
    }
    return `${API_BASE}${downloadPath}`
  }
}

export default api
