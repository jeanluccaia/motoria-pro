interface CheckoutFrameProps {
  src: string
  title: string
}

export function CheckoutFrame({ src, title }: CheckoutFrameProps) {
  return (
    <div className="overflow-hidden rounded-3xl shadow-lg md:rounded-[24px]">
      <iframe
        src={src}
        title={title}
        className="w-full border-0 bg-white"
        style={{ minHeight: '840px' }}
        allow="payment"
        loading="eager"
      />
    </div>
  )
}
