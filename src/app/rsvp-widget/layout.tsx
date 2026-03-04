// Minimal layout for the RSVP widget — no shared nav/footer, frame-safe.
export const metadata = {
  title: 'RSVP',
  robots: 'noindex',
}

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children
}
