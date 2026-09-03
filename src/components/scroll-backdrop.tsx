export function ScrollBackdrop() {
  return (
    <>
      <picture>
        <source media="(max-width: 639px)" srcSet="/scroll-bg-mobile.jpg" />
        <img
          src="/scroll-bg.jpg"
          alt=""
          className="pointer-events-none fixed inset-0 -z-10 size-full object-cover"
        />
      </picture>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-parchment/58" />
    </>
  );
}
