import Image from 'next/image';

const partnerLogoClass =
  'h-auto shrink-0 object-contain opacity-70 [filter:brightness(0)_saturate(0)]';

export default function EventHeader() {
  return (
    <header className="relative z-20 flex justify-center px-4 pb-3 pt-5 md:pt-8">
      <div
        className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border border-white/60 bg-findit-50/95 px-4 py-2 shadow-[0_8px_28px_rgba(20,39,92,0.22)] sm:gap-x-5 sm:px-5"
        aria-label="Event partners"
      >
        <div className="flex shrink-0 items-center gap-2">
          <Image
            src="/findit/ugm-logo.svg"
            alt="Universitas Gadjah Mada"
            width={32}
            height={32}
            className={`${partnerLogoClass} w-8`}
          />
          <span className="text-[12px] font-semibold uppercase leading-none text-findit-900/70">
            Universitas
            <br />
            Gadjah Mada
          </span>
        </div>
        <Image
          src="/findit/kmteti-logo.svg"
          alt="KMTETI"
          width={27}
          height={32}
          className={`${partnerLogoClass} w-7`}
        />
        <Image
          src="/findit/nl-logo.svg"
          alt="Night Login"
          width={25}
          height={21}
          className={`${partnerLogoClass} w-8`}
        />
        <div className="flex h-8 shrink-0 items-center px-1 font-mono te
        xt-lg font-black italic leading-none text-findit-900/75">
 Find<span className="text-findit-700">IT</span>
    </div>
        <Image
          src="/findit/ai-connect-logo.png"
          alt="AI Connect"
          width={2784}
          height={412}
          className="h-6 w-auto max-w-[132px] shrink-0 object-contain sm:h-7 sm:max-w-[160px]"
        />
      </div>
    </header>
  );
}
