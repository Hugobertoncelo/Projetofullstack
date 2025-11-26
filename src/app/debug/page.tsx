'use client'

import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'

export default function DebugPage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const checkToken = () => {
      const storedToken = apiService.getToken()
      setToken(storedToken)
      addLog(`Token found: ${!!storedToken}`)
    }
    
    checkToken()
  }, [])

  const testLogin = async () => {
    try {
      addLog('Attempting login...')
      const response = await apiService.login({
        email: 'test@example.com', 
        password: 'TestPassword123!'
      })
      
      addLog(`Login response: ${JSON.stringify(response)}`)
      
      if (response.success && response.data?.token) {
        apiService.setToken(response.data.token)
        setToken(response.data.token)
        setUser(response.data.user)
        addLog('Login successful!')
      }
    } catch (error) {
      addLog(`Login error: ${error}`)
    }
  }

  const testGetUser = async () => {
    try {
      addLog('Getting current user...')
      const response = await apiService.getCurrentUser()
      addLog(`Get user response: ${JSON.stringify(response)}`)
      
      if (response.success) {
        setUser(response.data?.user)
      }
    } catch (error) {
      addLog(`Get user error: ${error}`)
    }
  }

  const testGetConversations = async () => {
    try {
      addLog('Getting conversations...')
      const response = await apiService.getConversations()
      addLog(`Conversations response: ${JSON.stringify(response)}`)
      
      if (response.success) {
        setConversations(response.data?.conversations || [])
      }
    } catch (error) {
      addLog(`Get conversations error: ${error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Chat App</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Controls</h2>
          
          <button 
            onClick={testLogin}
            className="block w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          
          <button 
            onClick={testGetUser}
            className="block w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get Current User
          </button>
          
          <button 
            onClick={testGetConversations}
            className="block w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Get Conversations
          </button>
          
          <div>
            <h3 className="font-semibold">Current State:</h3>
            <p>Token: {token ? '✅ Present' : '❌ Missing'}</p>
            <p>User: {user ? `✅ ${user.username}` : '❌ Not logged in'}</p>
            <p>Conversations: {conversations.length} found</p>
          </div>
        </div>

        {/* Data Display */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Data</h2>
          
          {user && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold">User:</h3>
              <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
          
          {conversations.length > 0 && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold">Conversations ({conversations.length}):</h3>
              {conversations.map(conv => (
                <div key={conv.id} className="border-b py-2">
                  <p className="font-medium">ID: {conv.id}</p>
                  <p>Members: {conv.otherMembers?.map((m: any) => m.username).join(', ')}</p>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-600">Last: {conv.lastMessage.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
        
        <button 
          onClick={() => setLogs([])}
          className="mt-2 px-4 py-1 bg-red-500 text-white rounded text-sm"
        >
          Clear Logs
        </button>
      </div>
    </div>
  )
}
