interface CheckoutFrameProps {
  src: string
  title: string
}

export function CheckoutFrame({ src, title }: CheckoutFrameProps) {
  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <iframe
        src={src}
        title={title}
        className="w-full border-0 bg-white"
        style={{ minHeight: '900px' }}
        allow="payment"
        loading="eager"
        scrolling="yes"
      />
    </div>
  )
}
