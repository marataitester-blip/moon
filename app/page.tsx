export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-void relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 text-center space-y-6">
        <h1 className="text-6xl md:text-8xl font-serif tracking-[0.2em] text-gold drop-shadow-lg">
          LUNA
        </h1>
        <p className="text-zinc-500 font-sans tracking-widest text-xs md:text-sm uppercase">
          Aura Heritage System
        </p>
      </div>
    </main>
  );
}