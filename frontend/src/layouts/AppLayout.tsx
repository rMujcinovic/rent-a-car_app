import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
export default function AppLayout(){ const {user,logout}=useAuth(); return <div className='max-w-6xl mx-auto p-4 space-y-4'><nav className='flex gap-3 items-center'>{['/cars','/my-reservations'].map(p=><Link key={p} to={p}>{p.replace('/','')}</Link>)}{user?.role==='admin'&&<><Link to='/admin/dashboard'>dashboard</Link><Link to='/admin/cars'>admin cars</Link><Link to='/admin/reservations'>admin reservations</Link></>}<button onClick={logout} className='ml-auto'>logout</button></nav><Outlet/></div> }
