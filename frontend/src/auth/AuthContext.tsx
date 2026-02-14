import { createContext, useContext, useState } from 'react'
import { api } from '../api/client'
import { User } from '../api/types'

type Ctx = { user: User|null; login:(u:string,p:string)=>Promise<void>; register:(u:string,p:string)=>Promise<void>; logout:()=>void }
const AuthContext = createContext<Ctx>({} as Ctx)
export const useAuth = ()=>useContext(AuthContext)
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user, setUser] = useState<User|null>(JSON.parse(localStorage.getItem('user')||'null'))
  const login = async (username:string,password:string) => { const {data}=await api.post('/auth/login',{username,password}); localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setUser(data.user) }
  const register = async (username:string,password:string)=>{ await api.post('/auth/register',{username,password}) }
  const logout = ()=>{ localStorage.clear(); setUser(null) }
  return <AuthContext.Provider value={{user,login,register,logout}}>{children}</AuthContext.Provider>
}
