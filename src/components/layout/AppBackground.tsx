

export const AppBackground = () => (
    <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500" />

        {/* Subtle radial accents */}
        <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full 
        bg-indigo-500/10 blur-3xl transform -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full 
        bg-purple-500/10 blur-3xl transform translate-y-1/2" />
        </div>

        {/* Noise texture (3% opacity) */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}
        />
    </div>
);
