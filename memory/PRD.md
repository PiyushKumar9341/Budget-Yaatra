# Budget Yatra — Product Requirements Doc

## Original problem statement (verbatim)
> "see python based project bnaani hai mujhe jisme ai intergrated ho and at the same time mujhe apni clg me as a mini project dena hai jo ki aage in future major v bnega... budget yatra ka plan kiya tha maine from frontend to backend ui/ux top notch aisa lge ki aaj ke genration ki website hai with data base and i will be working all alone kii basically aaj kl sare commision based ho gye h recomendation buti wanted ki ekdm roots se juda rhe website khole to alg alg jgh ke location ke hisb se website ka theme change ho jaaye jaise kii mumbai to beach theme ganpati ji theme ladakh search kre to pahad road like that stay kha krna hai local best food koi choti se dukaan ho through google map se dhekhe location and many more... ai ka role sb kch rhega map ke liye free option user genuine kre to hii upload krnge uske review google auth jruur se krnge cities honi chaiye moutains padhad rivers meghalaya side"

## Vision
An anti-commission, roots-connected Indian travel discovery platform. Genuine hidden gems, homestays, chhoti dukaan chai stalls — not commercial hotel chains. AI plans itineraries; users read/write only-authenticated reviews.

## Architecture
- **Backend**: FastAPI, MongoDB (motor), `emergentintegrations` (Gemini 3 Flash)
- **Frontend**: React 19 + Tailwind + framer-motion + react-leaflet + sonner
- **Auth**: Emergent-managed Google OAuth (cookie + Bearer header)
- **Maps**: OpenStreetMap / Carto tiles (100% free, no key)
- **AI**: Gemini 3 Flash Preview via Emergent Universal Key

## Core Requirements (static)
1. Dynamic destination-based theming (root `data-destination` attribute → CSS variables)
2. AI Trip Planner (multi-step wizard → day-by-day itinerary JSON)
3. AI Chatbot "Yatri" (Hinglish, SSE streamed, per-destination context)
4. Genuine reviews (only logged-in users)
5. Google login, saved trips, wishlist
6. Interactive map with custom pins for stays + food spots
7. Editorial magazine aesthetic (Cabinet Grotesk + Cormorant Garamond + Satoshi)

## User Personas
- **Solo Gen-Z traveller** — wants ₹5–8k weekend trips, authentic experiences
- **Backpacker** — hidden village stays, off-grid food joints
- **College friends group** — budget itinerary + adventure

## What's Implemented (28 Jul 2026)
- [x] 8 seeded destinations (Meghalaya, Ladakh, Rishikesh, Manali, Spiti, Sikkim, Kasol, Tawang) with stays, food spots, coords, highlights
- [x] Cinematic landing page (hero + bento grid + marquee ribbon + AI CTA)
- [x] Destination detail page with dynamic per-slug theme, stats, highlights, stays, food, map, reviews
- [x] 5-step AI Trip Planner + timeline result view
- [x] Chat drawer with SSE streaming (Gemini 3 Flash)
- [x] Emergent Google Auth (Layout login button + AuthCallback route)
- [x] Wishlist toggle + My Trips page
- [x] Genuine review form (auth-gated, 20+ char min)
- [x] Full data-testid coverage
- [x] Backend end-to-end tested 9/9 endpoints pass + manual verified AI planner (₹5800 real Gemini response), chat streaming, save/mine

## Updated (28 Jul 2026 — Iteration 2)
- [x] Added 3 new destinations with unique themes: **Kashmir** (chinar red + dal teal), **Coorg** (coffee brown + rainforest green), **Andaman** (turquoise sea + coral) — total now **11 destinations**
- [x] Community Stories / Blog system:
    - Backend: `POST /api/stories`, `GET /api/stories?destination_slug=`, `GET /api/stories/{id}`, `POST /api/stories/{id}/like`, `GET /api/stories-mine`
    - Frontend pages: `/stories` (list + filter), `/stories/new` (editor, auth-gated), `/stories/:id` (detail with drop-cap magazine layout)
    - Long-form content (150+ char min), read-time auto-calculated, likes, tags
    - Stories preview strip added on destination detail pages
    - Seeded 3 sample stories (Kashmir, Coorg, Andaman)

## Updated (28 Jul 2026 — Iteration 3)
- [x] **Rentals + Local Guides sections** added to every destination:
    - Each destination has 2-3 rental options (bike/scooter/auto/cab/shikara/cycle) with vendor name, vehicle type, ₹/day, coords, note
    - Each destination has 2 local guides with name, specialty, languages, ₹/day, coords, backstory
    - Union rate / no-commission messaging built into UI
    - Map now shows 4 pin colors: theme-color (stays), dark (food), orange (rentals), purple (guides)
    - New sections rendered between "food" and "map" on `/destination/:slug`

## Updated (28 Jul 2026 — Iteration 4)
- [x] **Phone numbers** auto-injected into every rental + guide (deterministic Indian-format mock numbers via MD5 hash)
- [x] **Book on WhatsApp** button on every partner card — deep-links to `wa.me/<phone>` with pre-filled Hinglish message including destination and vehicle/specialty context
- [x] **Partner Rating system**:
    - Backend: `POST /api/partners/rate` (auth, upserts one rating per user+partner), `GET /api/destinations/{slug}/partner-ratings` (returns aggregated avg + count + recent 5 reviews per partner)
    - Frontend: Rate button opens `PartnerRateModal` (5-star + optional comment)
    - Aggregate rating badge (⭐ avg + count) shown top-right on every partner card
    - Recent reviews rendered inline at bottom of card (last 2)

## Bug fix + Business flaw fix (28 Jul 2026 — Iteration 5)
- [x] Fixed 2 broken hero images: **Sikkim** (turquoise alpine lake) + **Tawang** (snow peak with clouds) now render via Pexels URLs (verified HTTP 200)
- [x] **CRITICAL business fix** — partner phone numbers are now HIDDEN by default from all public destination responses (`_strip_contact()` scrubs them from `GET /destinations`, `GET /destinations/{slug}`, AND `GET /wishlist`)
- [x] New auth-gated reveal flow:
    - `POST /api/partners/reveal` requires Google login, returns phone + logs to `partner_reveals` collection (user_id, timestamp)
    - `GET /api/partners/reveal-count/{slug}` — public aggregate showing how many yatris contacted each partner (future social-proof "N yatris contacted this week" chip)
    - UI: Card shows "🔒 Contact hidden · sign in to reveal" until revealed; button reads "Reveal & Book on WhatsApp"
- [x] Prevents users from bypassing the platform (fixes the "why would guides use my website" concern)
- [x] Creates monetization + retention leverage: platform now has data on which partners are getting real interest — foundation for a future "Featured Yatri Partner" paid subscription
- [x] **Verified via testing_agent: 15/15 backend tests pass** (auth-gated reveal 401/200, phone-key absence in all public responses, image URLs, rating/regression)
- [x] Post-test code review fix applied: `/api/wishlist` was still leaking phones — now stripped

## Iteration 6 — Domain choice, Professional Footer, Smoothness upgrade (28 Jul 2026)
- [x] Brand renamed **Budget Yatra → Budget Yaatra** everywhere (matches Hindi transliteration "यात्रा", closer to authentic pronunciation; user's domain preference)
- [x] Full editorial-magazine **Footer** built:
    - 4-column grid: Brand + newsletter · Explore · Community · Follow along
    - Giant "Yaatra" watermark at bottom (5% opacity)
    - Newsletter form with paper-plane submit (client-side toast, backend hook TODO)
    - 4 social icon placeholders (Instagram/Twitter/YouTube/LinkedIn) with hover lift + brand-color fill animation — user to replace `#` hrefs manually
    - Email "Say Namaste" link (mailto:hello@budgetyaatra.in)
    - Bottom bar with copyright + Privacy/Terms/Roots-pledge links
- [x] **Smoothness upgrades**:
    - Global `scroll-behavior: smooth`
    - Custom subtle scrollbar
    - `.link-underline` reveal animation for nav links (from-right → to-left slide-in on hover)
    - Smoother card lift with box-shadow
    - Cubic-bezier(0.16,1,0.3,1) easing on all pill buttons + cards
    - Text selection now glows with brand color
- [x] **Motion helpers**:
    - `<ScrollProgress />` — thin gradient bar at top showing reading progress
    - `<PageFade>` wrapping every route → 0.45s fade+lift transition on route change
    - `useRevealOnScroll()` hook + `.reveal-up` CSS class for future scroll reveals
- **P1**: Community stories page (write-ups, not just reviews)
- **P1**: Add more destinations (Kashmir, Coorg, Andaman, Kanyakumari) with unique themes
- **P2**: Public-facing itinerary sharing (unique share links)
- **P2**: Offline itinerary PDF export
- **P2**: Traveller matching (find someone going same time, same place)
- **P3**: Multi-lingual (Hindi/Marathi/Tamil UI)
- **P3**: Push notifications for weather alerts before trip
