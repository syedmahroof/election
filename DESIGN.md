# Design System Specification: The Verdant Archive

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Estate."** 

Moving away from the sterile, utilitarian aesthetic of typical government portals, this system treats digital space as a premium physical environment. It is inspired by the lush landscapes and rich heritage of Kerala, reimagined through a lens of high-end editorial design. We achieve this by rejecting the "standard grid" in favor of intentional asymmetry, generous whitespace (breathing room), and a tactile layering of elements. 

The goal is to move from "User Interface" to "Digital Experience"—where every interaction feels like turning the page of a beautifully bound, gold-embossed archive. We use **Organic Professionalism** to balance the authority of a state institution with the warmth of a celebratory cultural identity.

---

## 2. Colors: Tonal Depth & Soul
Our palette is rooted in the deep greens of the Sahyadri mountains and the ceremonial luster of gold. 

### The Palette (Material 3 Logic)
*   **Primary (#00341b) & Primary Container (#004d2a):** The core of our identity. Use the Container variant for large immersive sections to provide a sense of "The Verdant Archive."
*   **Secondary (#775a19):** Our "Deep Gold." Reserved for accents that signify prestige and high-level actions.
*   **Surface (#fbf9f4):** An off-white, paper-like foundation that prevents the "digital fatigue" of pure white.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning content. To define boundaries, use background shifts. A `surface-container-low` section should sit against a `surface` background to create a "pocket" of content. High-contrast lines are replaced by tonal transitions.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
*   **Level 1 (Base):** `surface` (#fbf9f4)
*   **Level 2 (In-set Content):** `surface-container-low` (#f5f3ee)
*   **Level 3 (Interactive Cards):** `surface-container-lowest` (#ffffff) for maximum "lift."
*   **Level 4 (High Prominence):** `surface-container-highest` (#e4e2de) for utility bars or footer foundations.

### The "Glass & Gold" Rule
To add professional "soul," use subtle gradients. CTAs should transition from `primary` (#00341b) to `primary_container` (#004d2a) at a 135° angle. For floating navigation or premium overlays, use **Glassmorphism**: `surface` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: The Editorial Voice
We pair the geometric clarity of **Public Sans** with the rhythmic, traditional curves of **Manjari**.

*   **Display (Display-LG 3.5rem):** Reserved for grand statements. Use `primary` color with tight letter-spacing (-0.02em) to create an authoritative, headline-style look.
*   **Headline (Headline-MD 1.75rem):** Use Manjari for Malayalam headers to emphasize cultural heritage. In English, Public Sans Semi-Bold provides the "Official" weight.
*   **Body (Body-LG 1rem):** High legibility is paramount. Always use `on_surface` (#1b1c19) with a 1.6 line-height to ensure the text feels airy and accessible.
*   **Labels (Label-MD 0.75rem):** Use `secondary` (Gold) for labels to draw the eye to micro-data or categories without overpowering the primary message.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "heavy" for a premium government archive. We use **Ambient Depth**.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on top of `surface-container-low` backgrounds. This creates a natural "paper on desk" effect without a single pixel of shadow.
*   **Ambient Shadows:** For floating elements (Modals/Dropdowns), use a multi-layered shadow: `0px 10px 30px rgba(0, 52, 27, 0.06)`. Note the tint—the shadow is a deep green-grey, not black, to harmonize with the palette.
*   **The "Ghost Border":** If a container requires a border for accessibility, use `outline_variant` (#c0c9bf) at **15% opacity**. This creates a whisper of a line that defines the edge without cluttering the visual field.

---

## 5. Components

### Buttons
*   **Primary:** A gradient of `primary` to `primary_container` with `lg` (1rem) rounded corners. Text is `on_primary` (#ffffff).
*   **Secondary:** No fill. A 1px "Ghost Border" using `secondary` (#775a19) at 40% opacity. Gold text.
*   **Tertiary:** Purely typographic. `primary` text with a 2px underline that appears only on hover.

### Cards & Lists
*   **Constraint:** Zero divider lines.
*   **Styling:** Use a `1.5rem (xl)` corner radius. Separate list items using a `12px` vertical gap and a subtle background shift to `surface_container_low` on hover. 
*   **Texture:** Hero cards may feature a subtle "paper grain" overlay (2% opacity) to enhance the "Archive" feel.

### Input Fields
*   **Default:** `surface_container_lowest` background with a soft `outline_variant` ghost border. 
*   **Focus:** The border transitions to 1px `secondary` (Gold), and a soft gold outer glow (4px blur) appears.

### Signature Component: The "Archive Header"
A prominent, full-width section using `primary_container`. It should feature an asymmetrical layout: title left-aligned, with a decorative gold-stroke pattern inspired by Kerala mural art subtly ghosted into the background (5% opacity).

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Whitespace:** If it feels "empty," it's likely working. Space is a luxury.
*   **Use Intentional Asymmetry:** Offset images or text blocks by 24px-48px to create a modern, editorial rhythm.
*   **Prioritize Manjari:** Use the Malayalam typeface for section headers even in English-first layouts to ground the brand in its locale.

### Don't:
*   **Don't use 100% Black:** Use `on_surface` (#1b1c19). Pure black breaks the "Verdant Archive" softness.
*   **Don't use Standard Shadows:** Avoid the "fuzzy grey" default. If it isn't tinted with our emerald green, it doesn't belong.
*   **Don't use Sharp Corners:** The `16px (lg)` and `24px (xl)` radius are non-negotiable. Softness represents the welcoming nature of the state.