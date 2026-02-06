/**
 * API Client
 * Axios wrapper for making requests to the backend API
 *
 * This file centralizes all API calls, making it easy to:
 * - Change the base URL
 * - Add authentication headers
 * - Handle errors consistently
 * - Add request/response interceptors
 */

import axios, { AxiosError } from 'axios'
import type { AnalysisRequest, AnalysisResponse } from '@/types'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (for adding auth tokens, logging, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add authentication token if needed
    // const token = localStorage.getItem('auth_token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor (for handling errors, logging, etc.)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status)
    return response
  },
  (error: AxiosError) => {
    console.error('[API] Response error:', error)

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = (error.response.data as any)?.detail || error.message

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`)
        case 401:
          throw new Error('Unauthorized: Please log in')
        case 403:
          throw new Error('Forbidden: You do not have permission')
        case 404:
          throw new Error('Not Found: Resource does not exist')
        case 500:
          throw new Error('Server Error: Please try again later')
        default:
          throw new Error(`Error ${status}: ${message}`)
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network Error: Cannot reach the server')
    } else {
      // Something else happened
      throw new Error(`Error: ${error.message}`)
    }
  }
)

/**
 * API Functions
 */

/**
 * Analyze a prompt for security threats
 */
export const analyzePrompt = async (
  request: AnalysisRequest
): Promise<AnalysisResponse> => {
  const response = await apiClient.post<AnalysisResponse>(
    '/api/v1/analyze/',
    request
  )
  return response.data
}

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await apiClient.get('/health')
  return response.data
}

/**
 * Get API info
 */
export const getApiInfo = async (): Promise<any> => {
  const response = await apiClient.get('/')
  return response.data
}

export default apiClient
