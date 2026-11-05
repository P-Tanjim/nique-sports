import Script from 'next/script';

function sanitizeId(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  // If user pasted a full URL or script with GA measurement ID
  const gaMatch = str.match(/G-[A-Za-z0-9]+/i) || str.match(/UA-[0-9]+-[0-9]+/i);
  if (gaMatch) return gaMatch[0];
  // If user pasted a Meta pixel ID inside a snippet or URL
  const pixelMatch = str.match(/\b\d{10,20}\b/);
  if (pixelMatch) return pixelMatch[0];
  // Otherwise strip quotes, brackets, and whitespace
  return str.replace(/['"<>\s;]/g, '');
}

export default function Analytics({ metaPixelId, gaId }) {
  const cleanPixelId = sanitizeId(metaPixelId);
  const cleanGaId = sanitizeId(gaId);

  if (!cleanPixelId && !cleanGaId) {
    return null;
  }

  return (
    <>
      {/* ─── Google Analytics (GA4) ─── */}
      {cleanGaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${cleanGaId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${cleanGaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* ─── Meta (Facebook) Pixel ─── */}
      {cleanPixelId && (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${cleanPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${cleanPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}

