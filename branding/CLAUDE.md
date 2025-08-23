# Branding Guidelines - Powered by Donation

## JustGiving Brand Guidelines

### Brand Assets Location
- **Assets Folder**: `/justgivingassets/` contains official JustGiving brand materials
- **Logo Files**: `JG_LOGO_PRIMARY_NEW.svg`, `JG_LOGO_PRIMARY_NEW.png`, various white and purple variants
- **Brand Guidelines**: `JG_GLOBAL_BrandGuidelines_Nov_2022_FINAL2.pdf` (comprehensive 75-page document)

### Core Brand Identity
- **Primary Brand Color**: "Jurple" #7A04DD (JustGiving's signature purple)
- **Typography**: Inter font family
  - Extra Bold for headlines (-20pt spacing)
  - Semi Bold for headers (-20pt spacing) 
  - Medium for subheadings (-10pt spacing)
  - Regular for body copy (0pt spacing)
- **Logo Variants**: 
  - B2B: "JustGiving from Blackbaud" (endorsed brand)
  - Consumer: "JustGiving" standalone
  - Minimum sizes: 260px digital, 1.25" print (landscape); 450px digital, 2" print (stacked)

### Brand Voice & Values
- **Mission**: "We are making good things happen"
- **Vision**: "We believe the world will be a better place when good takes over"
- **Core Values**: 
  1. We inspire hope
  2. We make it possible  
  3. We share knowledge
  4. We're here for everyone
  5. We keep things simple
  6. We bring heart
- **Personality**: Friendly, honest, community minded, enthusiastic, empowering, supportive, reliable, knowledgeable
- **Tone**: "I care, I can" - from caring to action

### Visual Guidelines
- **Color Palette**:
  - Core: Jurple (#7A04DD), Violet (#B061F2), Dark Purple (#540099)
  - Accent: Orange (#FFA200) - consumer context, Impact Green (#0CD973) - B2B context, Pink (#FFA0C7)
  - Text: Charcoal (#252B33), Interaction Blue (#1667D9)
  - Background: White (#FFFFFF), Cloud (#E5E5E5)
- **Color Usage**: 80/20 mix (80% purple variants, 20% accent colors)
- **Logo Placement**: Left-aligned and anchored to top/bottom, never centered
- **Clear Space**: Use letter 'G' as measuring tool for spacing around logo

### Button & Interface Standards
- **Primary Buttons**: Interaction Blue (#1667D9) with white text
- **Secondary Buttons**: Grey outline with charcoal text
- **Donate Buttons**: Jurple (#7A04DD) with white text and 'G' logo
- **Typography**: Always use Charcoal for text legibility, Jurple only for headlines
- **Accessibility**: All color combinations meet WCAG AA compliance

### Photography & Graphics
- **Style**: Authentic, energetic, empowering, inclusive
- **Approach**: Real people in candid 'in action' moments showing "I care" to "I can"
- **Composition**: Light, bright, optimistic images celebrating diversity
- **Framing**: 6px radius rounded frames, can break frames for dimension
- **Marker Graphics**: Hand-drawn purple accents for emphasis, headline copy only

### Application Guidelines for Our Site
- **Donation Buttons**: Use official Jurple (#7A04DD) with white JustGiving logo
- **Platform Branding**: Consistent purple theming for JustGiving-related elements
- **Typography**: Implement Inter font weights where possible for JustGiving content
- **Logo Usage**: Use provided SVG/PNG assets with proper clear space and sizing
- **Color Compliance**: Follow 80/20 color ratio in JustGiving-branded sections
- **Accessibility**: Ensure all JustGiving elements meet WCAG AA contrast ratios

### Implementation Notes
- All JustGiving-branded elements should reflect their authentic, human-centered approach
- Maintain consistency with their "making good things happen" messaging
- Use purple (#7A04DD) as primary brand color for JustGiving platform elements
- Implement proper logo sizing and spacing guidelines
- Follow their inclusive, empowering visual language

## Every.org Brand Guidelines

### Brand Assets Location
- **Assets Folder**: `/public/` contains official Every.org brand materials
- **Logo Files**: Various Every.org logos, donation buttons, and wordmarks
- **Brand Colors**: Green theme (#10B981 and variants)

### Core Brand Identity
- **Primary Brand Color**: Green (#10B981)
- **Logo Integration**: Every.org green logo displayed in headers, platform home, and organization pages
- **Dynamic Platform Theming**: All components automatically adapt colors and text based on platform context

### Visual Implementation
- **ServiceCard Enhancement**: Added platform prop with complete color configuration (green theme for Every.org, purple for JustGiving)
- **Button Labels**: Dynamic platform-specific text ("Donate on Every.org & Get This" vs "Donate on JustGiving & Get This")
- **Consistent UX**: Green color scheme (borders, buttons, gradients, hover states) throughout Every.org pages

### Platform-Aware Components
- **OrganizationBrowse**: Supports Every.org theming
- **OrganizationPage**: Every.org nonprofit pages show proper platform indicators and donation buttons
- **PlatformHome**: Platform-specific branding and statistics
- **ServiceCard**: Complete green branding with Every.org logos and platform-specific labels

### Implementation Results
- **Every.org Pages**: Complete green branding with Every.org logos and correct platform-specific labels
- **Backwards Compatible**: JustGiving pages maintain purple branding, general service pages use default styling
- **Brand Assets Available**: Standard and crypto donation buttons, multiple logo variants ready for future use

## ACNC Brand Guidelines

### Brand Assets Location
- **Assets Folder**: `/acncassets/` and `/public/acnc/` contain ACNC brand materials
- **Logo Files**: `logo.svg` for official ACNC branding

### Implementation Guidelines
- **External Links**: "Search ACNC Register" links help users find organizations on official ACNC website
- **Profile Integration**: `https://www.acnc.gov.au/charity/charities?search=[ABN]` for all ACNC organizations
- **Cross-Component Usage**: External links work in both OrganizationCard (browse) and OrganizationPage (detail)

## Brand Implementation Standards

### Platform-Specific Theming
- **JustGiving**: Purple theme (#7A04DD) with official brand guidelines
- **Every.org**: Green theme (#10B981) with official brand assets
- **General Services**: Default styling that doesn't compete with platform branding

### Component Integration
- All platform-aware components automatically detect platform context
- Dynamic color schemes, button labels, and logo placement
- Consistent user experience within each platform's brand identity
- Cross-platform compatibility without brand conflicts