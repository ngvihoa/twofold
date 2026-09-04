import {
  Outlet,
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
        title: 'Twofold - Game chiến thuật 1v1',
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
      <body className="bg-background text-slate-100 min-h-[100dvh] flex flex-col">
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-10">
            <a href="/" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300/25 bg-rose-500 text-sm font-black text-slate-950 transition-transform group-hover:-rotate-3">
                TF
              </span>
              <span className="text-base font-black tracking-[0.14em] text-slate-100 sm:text-lg">
                TWOFOLD
              </span>
            </a>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="hidden sm:inline">Chiến thuật 1v1</span>
              <a
                href="/spec-reviewer"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 transition-colors hover:border-slate-500 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
              >
                Xem vai trò
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        <Scripts />
      </body>
    </html>
  );
}
