---
name: Ostomy World Premium Clinical
colors:
  primary: "#1A8F4C" # Medical Green derived from the interlocking hands logo
  secondary: "#FFC107" # Warm Gold/Yellow derived from the instructional infographics
  background: "#FFFFFF" # Pure White for maximum clinical legibility
  surface-card: "#F4F7F6" # Mint Tinted Gray for elevated product and educational cards
  text-main: "#1A1C1E" # Deep Ink for primary typography to reduce eye strain
  text-muted: "#6C7278" # Slate grey for secondary text and metadata
typography:
  h1:
    fontFamily: "Outfit, sans-serif"
    fontWeight: "700"
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: "Public Sans, sans-serif"
    fontWeight: "400"
    lineHeight: "1.6"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
---
## Overview
Clinical Safety meets Premium Active Lifestyle. The UI must evoke the resilience of a premium sports performance brand and the absolute, unshakeable trust of a surgical clinic. It serves the South Asian and global ostomate community. The aesthetic relies on generous whitespace, clean medical green CTAs, and striking gold/yellow numerical accents for educational steps.

## Component Rules
- **Buttons:** Primary buttons must use `{colors.primary}` background with `{colors.background}` text. Rounded corners set to `{rounded.md}`. No generic hover glows; use slight opacity shifts.
- **Cards:** Product and educational cards must use `{colors.surface-card}` to create spatial separation. Do not use heavy drop shadows. 
- **Typography:** Never use generic serif fonts. Stick strictly to the defined sans-serif stack to maintain a modern, hygienic aesthetic.
