# Warhammer Army Builder - Battle Forge UI

A React-based Warhammer army builder application with a modern mobile-first UI design.

## Features

- **Battle Forge Tab**: Create and manage army lists with a clean, card-based interface
- **Reference Tab**: Quick access to game rules and faction information
- **Profile Tab**: User settings and profile management
- **Responsive Design**: Mobile-first design with bottom navigation
- **Modal System**: Create new armies with a modal form interface

## Component Structure

```
src/components/
├── BattleForgeApp.tsx      # Main app shell and tab management
├── Header.tsx              # App header with title and menu
├── BottomNavigation.tsx    # Bottom tab navigation
├── BattleForgeTab.tsx      # Army list management
├── ReferenceTab.tsx        # Rules and reference content
├── ProfileTab.tsx          # User profile and settings
├── NewArmyModal.tsx        # Modal for creating new armies
└── FloatingActionButton.tsx # FAB for adding new armies
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: State management and side effects

## Development

The app is built with a component-based architecture where each tab is a separate component. The main `BattleForgeApp` component manages the active tab state and renders the appropriate content.

### Key Features

- **Tab Navigation**: Switch between Reference, Battle Forge, and Profile tabs
- **Modal System**: Create new armies with form validation
- **Responsive Layout**: Mobile-first design with proper spacing
- **Dark Theme**: Consistent dark theme throughout the application

## Future Enhancements

- Army list editing and management
- Unit selection and customization
- Points calculation and validation
- Army list sharing and export
- User authentication and data persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Documentation

Additional documentation can be found in the `scripts/` directory:
- `prd.md` - Project Requirements Document
- `.windsurfrules` - Development guidelines
- `tasks.json` - Project roadmap and tasks 