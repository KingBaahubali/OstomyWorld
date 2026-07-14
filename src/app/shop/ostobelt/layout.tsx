import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OstoBelt Active Support | Premium Ostomy Belt India",
  description: "Buy the OstoBelt Active Support online. A premium medical-grade ostomy and colostomy support belt designed for security, discretion, and an active lifestyle. Free shipping in India.",
  keywords: ["ostomy belt price india", "buy colostomy belt", "ostobelt", "active ostomy support"],
  openGraph: {
    title: "OstoBelt Active Support | Premium Ostomy Belt India",
    description: "Buy the OstoBelt Active Support online. A premium medical-grade ostomy and colostomy support belt designed for security, discretion, and an active lifestyle.",
    images: ["/assets/men_s_ileostomy_belt_2_5.png"],
  },
};

export default function OstoBeltLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "OstoBelt Active Support",
    "image": "https://ostomyworld.in/assets/men_s_ileostomy_belt_2_5.png",
    "description": "Premium active-support belt designed to secure your pouch close to the body with a discreet flange-lock system.",
    "brand": {
      "@type": "Brand",
      "name": "Ostomy World"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://ostomyworld.in/shop/ostobelt",
      "priceCurrency": "INR",
      "price": "2799",
      "priceValidUntil": "2027-12-31",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        }
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
