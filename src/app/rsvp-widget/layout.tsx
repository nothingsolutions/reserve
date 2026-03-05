// Minimal layout for the RSVP widget — no shared nav/footer, frame-safe.
export const metadata = {
  title: 'RSVP',
  robots: 'noindex',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      {children}
    </>
  )
}
