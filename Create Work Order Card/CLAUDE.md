# HubSpot UI Extensions Development Guide

## Commands
- `npm run dev`: Run development server with Sandbox account (hs accounts use 'UKIO|Sandbox' && hs project upload)
- `npm run prod`: Run production deploy (hs accounts use 'Ukio' && hs project upload)
- `npm run format`: Format code with Prettier (prettier --write "src/**/*.{js,jsx,ts,tsx}")
- `npm run postinstall`: Install dependencies for subfolders (cd ./src/app/extensions/ && npm install && cd ../app.functions && npm install)

## Code Style Guidelines
- **Imports**: Group imports by source (React, HubSpot UI components, local components)
- **Formatting**: Use Prettier with default settings
- **Naming**:
  - Components: PascalCase (e.g., SelectComponent)
  - Functions: camelCase (e.g., handleCreateWorkOrder)
  - Variables: camelCase (e.g., woDescription)
- **Error Handling**: Use try/catch blocks and display user-friendly error messages with Alert component
- **UI Components**: Use HubSpot UI Extensions components (@hubspot/ui-extensions) for consistency
- **State Management**: Use React hooks (useState, useEffect) for component state
- **API Calls**: Use runServerless for backend communication

## Project Structure
- `/src/app/extensions`: UI components and React code
- `/src/app/app.functions`: Serverless backend functions