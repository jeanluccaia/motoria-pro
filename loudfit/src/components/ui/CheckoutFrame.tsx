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
        className="min-h-[760px] w-full border-0 bg-white sm:min-h-[900px]"
        allow="payment"
        loading="eager"
        scrolling="yes"
      />
    </div>
  )
}
