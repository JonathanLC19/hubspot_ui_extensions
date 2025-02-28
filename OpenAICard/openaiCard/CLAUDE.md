# HubSpot UI Extensions Project Guidelines

## Development Commands
- `npm run dev` - Upload project to sandbox environment
- `npm run prod` - Upload project to production environment
- `npm run format` - Format code with Prettier
- `npm install` - Install dependencies (recursively installs dependencies for extensions and functions)

## Extension Patterns
- Use React functional components with hooks
- Use `useState` for component state management
- Use `useEffect` for side effects and data fetching
- Utilize HubSpot UI component library (`@hubspot/ui-extensions`)
- Handle API calls through serverless functions

## ServerlessFunctions
- Functions run in `app.functions` directory
- Use OpenAI API for text classification and analysis
- Expose environment variables through environment files (not in repo)
- Use `axios` for API requests
- Handle errors with try/catch blocks and return error objects

## Code Style
- Use ES6+ syntax and features
- Use PascalCase for components, camelCase for variables/functions
- Format code with Prettier (default settings)
- Add descriptive comments for complex logic
- Implement proper error handling in API calls
- Use async/await for asynchronous operations