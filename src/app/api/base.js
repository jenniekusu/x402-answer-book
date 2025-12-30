import axios from 'axios'
import { refreshTokenApi } from './userApi'
import { showToast } from '@/components/'

// Create the axios request instances
const defaultRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000000,
  httpAgent: true,
  httpsAgent: false,
  validateStatus(status) {
    return status >= 200
  }
})

const spiderRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000000,
  httpAgent: true,
  httpsAgent: false,
  validateStatus(status) {
    return status >= 200
  }
})

// Configure interceptors
const setupInterceptors = (request) => {
  request.interceptors.request.use((config) => {
    // Check if we are running in the browser
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })

  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(promise => {
      if (token) {
        promise.resolve(token)
      } else {
        promise.reject(error)
      }
    })
    failedQueue = []
  }

  request.interceptors.response.use(
    async (response) => {
      if (response.data.error === 'Unauthorized') {
        const originalRequest = response.config

        // Track retry attempts (maximum three per request)
        originalRequest._retryCount = originalRequest._retryCount || 0

        if (originalRequest._retryCount >= 3) {
          console.warn('🚫 Maximum retry attempts reached')
          return Promise.reject({ error: 'Max retries exceeded' })
        }

        if (!isRefreshing) {
          isRefreshing = true
          try {
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
            if (!refreshToken) {
              console.log('No refresh token available')
            }

            const { accessToken, refreshToken: _refreshToken} = await refreshTokenApi()

            if (typeof window !== 'undefined') {
              localStorage.setItem('token', accessToken)
              localStorage.setItem('refresh_token', _refreshToken)
            }

            processQueue(null, accessToken)
            isRefreshing = false

            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
            originalRequest._retryCount += 1
            return request(originalRequest)
          } catch (err) {
            processQueue(err, null)
            isRefreshing = false

            // Clear tokens and require the user to log in again
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token')
              localStorage.removeItem('refresh_token')
            }
            showToast?.('error', 'Session expired, please login again')
            return Promise.reject(err)
          }
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
              originalRequest._retryCount += 1
              resolve(request(originalRequest))
            },
            reject: (err) => reject(err),
          })
        })
      }
      if (response.data.error === 'MCP_AUTH_REQUIRED') {
        return response.data.error
      }
      if(response.data?.success === false && response.data?.error && response.data?.message) {
        showToast('error', response.data.message || 'Server error')
        return false
      }
      // console.log('createAgentFromTaskApi response', response)
      return response.data?.data
    },
    (error) => {
      return Promise.reject(error)
    }
  )


}

setupInterceptors(defaultRequest)
setupInterceptors(spiderRequest)

// Generic request helpers
export const get = (url, params = {}, useSpider = false) => {
  const request = useSpider ? spiderRequest : defaultRequest
  return request({
    method: 'GET',
    url,
    params
  })
}

export const deletes = (url, params = {}, useSpider = false) => {
  const request = useSpider ? spiderRequest : defaultRequest
  return request({
    method: 'DELETE',
    url,
    params
  })
}

export const post = (url, data = {}, headers = {}, useSpider = false) => {
  const request = useSpider ? spiderRequest : defaultRequest
  return request({
    method: 'POST',
    url,
    data,
    headers
  })
}

export const patch = (url, data = {}, headers = {}, useSpider = false) => {
  const request = useSpider ? spiderRequest : defaultRequest
  return request({
    method: 'PATCH',
    url,
    data,
    headers
  })
}

export const put = (url, data = {}, headers = {}, useSpider = false) => {
  const request = useSpider ? spiderRequest : defaultRequest
  return request({
    method: 'PUT',
    url,
    data,
    headers
  })
}


export const streamPost = async (url, data = {}, onMessage, useSpider = false) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL
  const fullUrl = baseURL + url

  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data)
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // If buffer contains multiple lines, process them one by one
      let lines = buffer.split('\n')
      buffer = lines.pop() // Keep the last line in case it's incomplete

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.replace(/^data:\s*/, '')
          if (jsonStr === '[DONE]') return

          try {
            const parsed = JSON.parse(jsonStr)
            onMessage(parsed)
          } catch (e) {
            console.warn('Failed to parse stream chunk:', e)
          }
        }
      }
    }

    // After the loop, process any leftover data in the buffer
    if (buffer.length > 0) {
      try {
        const parsed = JSON.parse(buffer)
        onMessage(parsed)
      } catch (e) {
        console.warn('Failed to parse remaining stream chunk:', e)
      }
    }

  } catch (err) {
    console.error('streamPost error:', err)
    throw err
  }
}
