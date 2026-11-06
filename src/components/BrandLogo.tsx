import { useId } from "react";

export default function BrandLogo({ className = "" }: { className?: string }) {
  const maskId = `shaba-logo-mask-${useId().replace(/:/g, "")}`;

  return (
    <svg aria-hidden="true" className={`brand-logo-art ${className}`} preserveAspectRatio="none" viewBox="0 215 512 80">
      <defs>
        <filter id={`${maskId}-cutout`}>
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.2126 0.7152 0.0722 0 0" />
          <feComponentTransfer>
            <feFuncA intercept="-0.225" slope="1.5" type="linear" />
          </feComponentTransfer>
        </filter>
        <mask id={maskId} maskContentUnits="userSpaceOnUse" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }} x="0" y="0" width="512" height="512">
          <image filter={`url(#${maskId}-cutout)`} href="/shaba-wordmark-mask.png" height="512" width="512" x="0" y="0" />
        </mask>
      </defs>
      <rect fill="currentColor" height="512" mask={`url(#${maskId})`} width="512" x="0" y="0" />
    </svg>
  );
}