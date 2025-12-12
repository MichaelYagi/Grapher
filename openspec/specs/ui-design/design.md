# Design: Colorful and Usable UI System

## Context
The Grapher application needs a vibrant, engaging user interface that maintains excellent usability and accessibility. The design must avoid common pitfalls like dark text on dark backgrounds while providing a modern, colorful aesthetic that enhances rather than detracts from the mathematical content.

## Goals
- Create a vibrant, engaging color palette with excellent contrast
- Ensure all text is highly readable with proper contrast ratios
- Provide intuitive visual feedback through color
- Maintain professional appearance while being colorful
- Support multiple themes while avoiding dark-on-dark combinations
- Enhance usability through thoughtful color coding

## Non-Goals
- Overly complex custom theming systems
- Excessive animations that distract from functionality
- Unconventional UI patterns that confuse users
- Color schemes that prioritize aesthetics over readability

## Color Palette Design

### Primary Palette
```css
/* Primary Colors - Vibrant but professional */
--primary-blue: #3B82F6;      /* Friendly, trustworthy */
--primary-teal: #14B8A6;      /* Modern, clean */
--primary-purple: #8B5CF6;    /* Creative, sophisticated */
--primary-indigo: #6366F1;    /* Deep, professional */

/* Accent Colors - Vibrant highlights */
--accent-coral: #F97316;      /* Warm, energetic */
--accent-emerald: #10B981;    /* Success, growth */
--accent-rose: #F43F5E;       /* Attention, errors */
--accent-amber: #F59E0B;      /* Warnings, highlights */

/* Neutral Colors - High contrast bases */
--neutral-900: #111827;       /* Dark text on light backgrounds */
--neutral-800: #1F2937;       /* Secondary text */
--neutral-700: #374151;       /* Tertiary text */
--neutral-100: #F3F4F6;       /* Light backgrounds */
--neutral-50: #F9FAFB;        /* Lightest backgrounds */
--white: #FFFFFF;             /* Pure white for maximum contrast */
```

### Function Graph Colors
```css
/* Function Plotting Colors - Distinct and harmonious */
--func-blue: #3B82F6;         /* Function 1 */
--func-emerald: #10B981;      /* Function 2 */
--func-purple: #8B5CF6;       /* Function 3 */
--func-orange: #F97316;       /* Function 4 */
--func-pink: #EC4899;         /* Function 5 */
--func-teal: #14B8A6;         /* Function 6 */
--func-indigo: #6366F1;       /* Function 7 */
--func-red: #EF4444;          /* Function 8 */
```

## Component Design System

### Typography System
```css
/* Font hierarchy with excellent readability */
--font-family-base: 'Inter', system-ui, sans-serif;
--font-family-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;    /* 12px - Small labels */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body text (minimum for accessibility) */
--text-lg: 1.125rem;   /* 18px - Important text */
--text-xl: 1.25rem;    /* 20px - Subheadings */
--text-2xl: 1.5rem;    /* 24px - Headings */
--text-3xl: 1.875rem;  /* 30px - Large headings */

--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Interactive Elements

#### Button Design
- **Primary Buttons**: Vibrant background with white text
- **Secondary Buttons**: Outlined style with colored borders
- **Hover States**: Subtle color shifts with smooth transitions
- **Active States**: Deeper colors with subtle shadows
- **Disabled States**: Muted colors with reduced opacity

#### Input Field Design
- **Normal State**: Subtle borders with light backgrounds
- **Focus State**: Colored borders (matching primary theme) with subtle shadows
- **Error State**: Red borders with error icons
- **Success State**: Green borders with success indicators

#### Slider Controls
- **Track**: Subtle base color with colored progress
- **Handle**: Vibrant colored handles with hover effects
- **Value Display**: Clear, readable numbers in contrasting colors
- **Labels**: High-contrast text for parameter names

### Layout and Spacing

#### Spacing System
```css
--space-1: 0.25rem;   /* 4px - Tight spacing */
--space-2: 0.5rem;    /* 8px - Element spacing */
--space-3: 0.75rem;   /* 12px - Component spacing */
--space-4: 1rem;      /* 16px - Section spacing */
--space-6: 1.5rem;    /* 24px - Container padding */
--space-8: 2rem;      /* 32px - Major sections */
```

#### Layout Principles
- **Card-based design**: Subtle shadows and borders for visual grouping
- **Generous white space**: Prevents visual crowding
- **Consistent alignment**: Grid-based layout for professional appearance
- **Responsive design**: Adapts gracefully to different screen sizes

## Graph Visualization Design

### Coordinate System Styling
- **Background**: Very light gray or subtle gradient for contrast
- **Grid lines**: Subtle gray lines that don't compete with functions
- **Axes**: Slightly darker than grid lines, distinct colors for x and y axes
- **Labels**: High-contrast text with readable sizing
- **Origin marker**: Slightly emphasized to show center point

### Function Curve Styling
- **Line thickness**: 2-3px for visibility without being overwhelming
- **Anti-aliasing**: Smooth curves for professional appearance
- **Color consistency**: Same colors used in UI controls and legends
- **Transparency**: Slight transparency for overlapping functions

### Interactive Elements
- **Hover highlights**: Bright, contrasting colors for curve emphasis
- **Selection indicators**: Vibrant markers with clear visual distinction
- **Tooltips**: Semi-transparent backgrounds with high-contrast text
- **Animation**: Smooth color transitions and scaling effects

## Theme Variations

### Light Theme (Default)
- **Backgrounds**: White and very light grays
- **Text**: Dark grays and blacks for maximum contrast
- **Accents**: Vibrant colors that pop against light backgrounds
- **Purpose**: Maximum readability and professional appearance

### Dark Theme
- **Backgrounds**: Dark grays and blues (never pure black)
- **Text**: Light grays and whites for excellent contrast
- **Accents**: Slightly muted versions of vibrant colors
- **Purpose**: Reduced eye strain in low-light environments

### High Contrast Theme
- **Maximum contrast ratios**: Exceeds WCAG 2.1 AAA standards where possible
- **Bold color choices**: Maximum distinction between elements
- **Accessibility focus**: Designed for users with visual impairments

## Accessibility Considerations

### Color Contrast
- **Minimum WCAG AA**: 4.5:1 contrast ratio for normal text
- **Enhanced AAA**: 7:1 contrast ratio where possible
- **Large text**: 3:1 minimum contrast for 18px+ text
- **UI elements**: 3:1 minimum for graphical objects

### Beyond Color
- **Icons and shapes**: Supplement color coding with symbols
- **Text labels**: Ensure all color-coded information has text alternatives
- **Patterns**: Use patterns in addition to colors for graph differentiation
- **Focus indicators**: Clear, visible focus states for keyboard navigation

### Animation Preferences
- **Reduced motion**: Respect prefers-reduced-motion settings
- **Animation controls**: Provide options to disable animations
- **Performance**: Smooth 60fps animations with proper fallbacks

## Implementation Strategy

### CSS Architecture
```css
/* Design tokens for maintainability */
:root {
  /* Color definitions */
  /* Typography scales */
  /* Spacing system */
  /* Animation timing */
}

/* Component-specific styling */
.component-name {
  /* Base styles */
  /* Color variations */
  /* Interactive states */
}

/* Theme-specific overrides */
[data-theme="dark"] {
  /* Dark theme color overrides */
}
```

### Component Structure
```
UIComponents/
├── Button/
│   ├── index.tsx           # Main component
│   ├── Button.styles.ts    # Styled components
│   └── Button.types.ts     # Type definitions
├── Input/
│   ├── index.tsx           # Input component
│   ├── Input.styles.ts     # Styling variants
│   └── Input.types.ts      # Input types
├── Slider/
│   ├── index.tsx           # Slider component
│   ├── Slider.styles.ts    # Colorful styling
│   └── Slider.types.ts     # Slider types
└── Graph/
    ├── Canvas.tsx          # Graph rendering
    ├── Graph.styles.ts     # Graph theming
    └── Graph.types.ts      # Graph types
```

## Testing Strategy

### Visual Testing
- **Screenshot testing**: Automated visual regression testing
- **Cross-browser testing**: Consistent appearance across browsers
- **Responsive testing**: Proper display at all screen sizes
- **Theme testing**: All themes render correctly and accessibly

### Accessibility Testing
- **Automated testing**: Axe or similar tools for accessibility compliance
- **Manual testing**: Screen reader testing and keyboard navigation
- **Contrast verification**: All color combinations meet contrast requirements
- **Color blind testing**: Ensure usability with various color vision deficiencies

### Performance Testing
- **Rendering performance**: Smooth animations at 60fps
- **Load performance**: Quick application startup and theme switching
- **Memory usage**: Efficient styling without excessive memory consumption

## Open Questions
- Should users be able to create custom color schemes?
- How many distinct function colors should be supported?
- Should we implement seasonal or event-based theme variations?
- Integration with system color preferences (automatic theme switching)?