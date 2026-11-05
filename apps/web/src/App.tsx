import { lazy, Suspense } from 'react'
import { createBrowserRouter, Link, RouterProvider } from 'react-router'
import { HomePage } from './pages/HomePage'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const CreditsPage = lazy(() => import('./pages/CreditsPage'))

const Loading = () => <div className="min-h-screen bg-ivory" />

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ocean-950 px-5 text-center text-ivory">
      <h1 className="text-5xl">Aquí no hay ninguna isla</h1>
      <Link to="/" className="link-underline">Volver al viaje</Link>
    </main>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/g/:groupId', element: <HomePage /> },
  { path: '/admin', element: <Suspense fallback={<Loading />}><AdminPage /></Suspense> },
  { path: '/creditos', element: <Suspense fallback={<Loading />}><CreditsPage /></Suspense> },
  { path: '*', element: <NotFound /> },
])

export function App() {
  return <RouterProvider router={router} />
}
