# Chtkay - Anonymous Chat Application

## Overview

Chtkay is a web-based anonymous chat application that allows users to connect with random people instantly while maintaining privacy. The application features a modern, dark-themed UI with gender selection and real-time user count display. It's built as a static frontend application with potential for backend integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- Vanilla HTML5, CSS3, and JavaScript
- Tailwind CSS (loaded via CDN) for utility-first styling
- Lucide Icons (loaded via CDN) for iconography

**Design Patterns:**
- Single-page application structure with a static HTML entry point
- Event-driven JavaScript for user interactions
- CSS-based theming with light/dark mode toggle

**UI/UX Decisions:**
- Mobile-first responsive design with max-width constraint (max-w-lg)
- Glassmorphism effects for navigation elements
- Gradient text effects for branding
- Interactive button states with hover/selected feedback

**Component Structure:**
- Header: Theme toggle, branding, online user count
- Banner: Promotional/notification area
- Main Content: Gender selection and chat action buttons
- Navigation: Bottom navigation bar (implied in structure)

### State Management

- DOM-based state using CSS classes (e.g., `.selected` for gender buttons, `.light-mode` for theme)
- No external state management library - suitable for simple interactions

### Theming System

- Dark mode as default
- Light mode toggle using body class `.light-mode`
- CSS custom overrides for Tailwind utility classes in light mode

## External Dependencies

### CDN-Loaded Libraries

| Library | Purpose | Source |
|---------|---------|--------|
| Tailwind CSS | Utility-first CSS framework | cdn.tailwindcss.com |
| Lucide Icons | Modern icon library | unpkg.com/lucide |

### Future Integration Considerations

- **WebSocket Server**: Required for real-time anonymous chat functionality
- **Backend API**: Needed for user matching, message routing, and online count
- **Database**: May be needed for chat history, user preferences, or moderation
- **Authentication**: Currently anonymous; may need session management for chat pairing

### File Structure

```
/
├── index.html    # Main entry point and HTML structure
├── style.css     # Custom styles and theme overrides
└── script.js     # Client-side interactivity and event handling
```

**Note:** The current implementation is frontend-only. Backend services for actual chat functionality (WebSocket server, user matching, message relay) would need to be implemented separately.