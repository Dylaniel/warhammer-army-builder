# Warhammer Army Builder

A modern web application for building and managing Warhammer 40k army lists. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- Create and manage army lists for Warhammer 40k
- Real-time points calculation
- Unit selection and customization
- Army list validation against game rules
- Local storage for saving army lists
- Modern, responsive interface
- Support for Space Marines (initial faction)

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

The project is built with:

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ESLint & Prettier for code quality

### Project Structure

```
src/
├── app/                 # Next.js 14 app router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── (routes)/       # Route groups
├── components/         # React components
│   ├── ui/            # Basic UI components
│   └── features/      # Feature-specific components
├── lib/               # Utility functions and shared logic
├── types/             # TypeScript type definitions
├── styles/            # Global styles
└── utils/             # Helper functions
```

### Key Directories

- `/src/app` - Next.js 14 app router pages and layouts
- `/src/components/ui` - Reusable UI components (buttons, inputs, etc.)
- `/src/components/features` - Feature-specific components (army lists, units, etc.)
- `/src/lib` - Core business logic and services
- `/src/types` - TypeScript interfaces and type definitions
- `/src/styles` - Global styles and Tailwind configuration
- `/src/utils` - Helper functions and utilities

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Tailwind CSS for styling

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