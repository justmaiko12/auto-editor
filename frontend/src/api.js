import axios from 'axios'

const API_BASE = '/api'

const api = {
  async uploadVideos(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },
  
  async analyzeVideo(projectId, silenceThreshold = 1.0) {
    const response = await axios.post(
      `${API_BASE}/analyze/${projectId}?silence_threshold=${silenceThreshold}`
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
    const response = await axios.post(`${API_BASE}/export/${projectId}`)
    return response.data
  },
  
  async getProject(projectId) {
    const response = await axios.get(`${API_BASE}/project/${projectId}`)
    return response.data
  },
  
  async deleteProject(projectId) {
    const response = await axios.delete(`${API_BASE}/project/${projectId}`)
    return response.data
  }
}

export default api
