import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
export default function ProtectedRoute({children,admin}:{children:JSX.Element;admin?:boolean}){ const {user}=useAuth(); if(!user) return <Navigate to='/login'/>; if(admin&&user.role!=='admin') return <Navigate to='/cars'/>; return children }
