export const AppBackground = () => (
  <div className='pointer-events-none fixed inset-0 -z-10'>
    {/* Base gradient */}
    <div className='absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950' />

    {/* Subtle radial accents */}
    <div className='absolute inset-0 opacity-30'>
      <div className='absolute left-1/4 top-0 h-96 w-96 -translate-y-1/2 transform rounded-full bg-indigo-500/10 blur-3xl' />
      <div className='absolute bottom-0 right-1/4 h-96 w-96 translate-y-1/2 transform rounded-full bg-purple-500/10 blur-3xl' />
    </div>

    {/* Noise texture (3% opacity) */}
    <div
      className='absolute inset-0 opacity-[0.03] mix-blend-soft-light'
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  </div>
);
