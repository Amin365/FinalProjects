import React from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X, ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSelector } from 'react-redux'
import ModleTogles from '../ModeTogle'

const NAV_LINKS = [
  { name: 'Home',        href: '/' },
  { name: 'Dashboard',  href: '/dashboard' },
  { name: 'Programs',   href: '/programmecards' },
  { name: 'Volunteers',      href: '/volunteer' },
  { name: 'About Us',href: '/about' },
]

const HeroHeader = () => {
  const [open, setOpen]         = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { user }                = useSelector(s => s.auth)
  const location                = useLocation()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* close mobile menu on route change */
  React.useEffect(() => { setOpen(false) }, [location.pathname])

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/*  top announcement strip  */}
      <div
        className={cn(
          'w-full overflow-hidden transition-all duration-500',
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
        )}
      >
        <div className="bg-orange-500 text-white text-center text-[12px] font-semibold py-2 tracking-wide">
          🎉 New programs just launched —&nbsp;
          <Link to="/programmecards" className="underline underline-offset-2 hover:text-orange-100 transition-colors">
            Explore now →
          </Link>
        </div>
      </div>

      {/*  main nav bar ─ */}
      <div
        className={cn(
          'transition-all duration-300',
          scrolled
            ? 'mx-3 mt-2'
            : 'mx-0 mt-0'
        )}
      >
        <nav
          className={cn(
            'transition-all duration-300',
            scrolled
              ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border border-slate-200/60 dark:border-gray-800/60 rounded-2xl shadow-lg shadow-black/5 px-5'
              : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-slate-100 dark:border-gray-900 px-6'
          )}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between h-15 py-3">

            {/*  Logo ─ */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/30 group-hover:scale-105 transition-transform">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <span className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                DPL<span className="text-orange-500">.</span>
              </span>
            </Link>

            {/*  Desktop links  */}
            <ul className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href)
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={cn(
                        'relative px-3.5 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-150',
                        active
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-gray-800/60'
                      )}
                    >
                      {link.name}
                      {active && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-orange-500" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/*  Desktop right actions  */}
            <div className="hidden lg:flex items-center gap-3">
              <ModleTogles />

              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
                  >
                    Log in
                  </Link>
                  {/* <Link
                    to="/register"
                    className="text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get started
                  </Link> */}
                </>
              ) : null
              }
            </div>

            {/*  Mobile right  */}
            <div className="flex lg:hidden items-center gap-2">
              <ModleTogles />
              <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/*  Mobile drawer  */}
      <div
        className={cn(
          'lg:hidden mx-3 overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 mt-1 p-4">
          <ul className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href)
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all',
                      active
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                    {link.name}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-slate-100 dark:border-gray-800 pt-4 flex flex-col gap-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-center py-2.5 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-center py-2.5 rounded-xl text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200 transition-all"
                >
                  Get started
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="text-center py-2.5 rounded-xl text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeroHeader