
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router'
import { Loader } from 'lucide-react'
import api from '../app/api/apislice'
import { setAuth, setClear } from '../app/AuthSlice'


function ProtectedRoute({ children }) {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user, token } = useSelector((state) => state.auth) || {}

  // Fetch current user only if we have a token
  const { data, isSuccess, isLoading, isError } = useQuery({
    queryKey: ["CurrentUser", token],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data
    },
    enabled: !!token,
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(setAuth({ user: data.user, token }))
    }
  }, [isSuccess, data, token, dispatch])

  useEffect(() => {
    if (isError) {
      dispatch(setClear()) 
    }
  }, [isError, dispatch])

  // Show loading UI
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect if no user or API error
  if (!user || isError) {
    return <Navigate to="/login" state={{ from: location }} replace  />
  }

  return children
}

export default ProtectedRoute
