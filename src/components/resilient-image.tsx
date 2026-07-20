import { useEffect, useState, type ImgHTMLAttributes, type ReactNode, type SyntheticEvent } from "react";

type ResilientImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  readonly src?: string;
  readonly fallback?: ReactNode;
  readonly fallbackSrc?: string;
};

function addRetryToken(src: string): string {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}image-retry=${Date.now()}`;
}

/**
 * Retries a failed image once without the browser/CDN cache, then renders a
 * controlled fallback instead of exposing the browser's broken-image icon.
 */
function ResilientImage({
  src,
  fallback = null,
  fallbackSrc,
  className,
  decoding = "async",
  onError,
  ...imageProps
}: ResilientImageProps): JSX.Element | null {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src);
    setAttempt(0);
    setFailed(!src);
  }, [src]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>): void => {
    onError?.(event);

    if (src && attempt === 0) {
      setAttempt(1);
      setCurrentSrc(addRetryToken(src));
      return;
    }

    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setAttempt(2);
      setCurrentSrc(fallbackSrc);
      return;
    }

    setFailed(true);
  };

  if (!currentSrc || failed) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return (
    <img
      {...imageProps}
      key={currentSrc}
      src={currentSrc}
      className={className}
      decoding={decoding}
      onError={handleError}
    />
  );
}

export default ResilientImage;
