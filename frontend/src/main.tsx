import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import './index.css'
import LoginPage from './pages/LoginPage'; import RegisterPage from './pages/RegisterPage'; import CarsPage from './pages/CarsPage'; import CarDetailPage from './pages/CarDetailPage'; import MyReservationsPage from './pages/MyReservationsPage'; import AdminCarsPage from './pages/AdminCarsPage'; import AdminReservationsPage from './pages/AdminReservationsPage'; import AdminDashboardPage from './pages/AdminDashboardPage'; import AppLayout from './layouts/AppLayout'; import { Toaster } from 'react-hot-toast'

const qc = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode><QueryClientProvider client={qc}><AuthProvider><BrowserRouter><Toaster/>
<Routes>
  <Route path='/login' element={<LoginPage/>}/><Route path='/register' element={<RegisterPage/>}/>
  <Route path='/' element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>
    <Route index element={<Navigate to='/cars'/>}/><Route path='cars' element={<CarsPage/>}/><Route path='cars/:id' element={<CarDetailPage/>}/><Route path='my-reservations' element={<MyReservationsPage/>}/>
    <Route path='admin/cars' element={<ProtectedRoute admin><AdminCarsPage/></ProtectedRoute>}/><Route path='admin/reservations' element={<ProtectedRoute admin><AdminReservationsPage/></ProtectedRoute>}/><Route path='admin/dashboard' element={<ProtectedRoute admin><AdminDashboardPage/></ProtectedRoute>}/>
  </Route>
</Routes>
</BrowserRouter></AuthProvider></QueryClientProvider></React.StrictMode>)
