export function FounderPresentationVideo() {
  return (
    <section
      aria-label="Vídeo de apresentação da Loud Fit Ipiranga"
      className="border-t border-white/[0.10] bg-[#0A0A0A]"
      style={{
        padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 80px)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[400px] justify-center">
        <video
          src="/media/ipiranga-sp/videos/video-apresentacao-ipiranga.mp4"
          controls
          playsInline
          preload="metadata"
          className="h-auto w-full rounded-2xl border border-white/[0.10] shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          style={{ aspectRatio: '9 / 16' }}
        />
      </div>
    </section>
  )
}
