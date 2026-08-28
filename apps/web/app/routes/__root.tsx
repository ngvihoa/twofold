import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import * as React from 'react';
import appCss from '../styles/app.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Twofold — 1v1 Turn-Based Strategy Web Alpha',
      },
      {
        name: 'description',
        content: 'Game đối kháng chiến thuật 1v1 theo lượt với vai trò ẩn lấy cảm hứng từ Ma Sói.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="vi" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-slate-100 min-h-screen flex flex-col">
        {/* Main Navigation Header */}
        <header className="border-b border-surface-highlight/40 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                TF
              </span>
              <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-rose-200">
                TWOFOLD
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                Alpha v0.1
              </span>
            </a>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="hidden sm:inline">1v1 Turn-based Strategy</span>
              <a
                href="/spec-reviewer"
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-400 transition-colors bg-surface-highlight/50 px-2.5 py-1 rounded border border-slate-700/50"
              >
                Role Atlas ↗
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

