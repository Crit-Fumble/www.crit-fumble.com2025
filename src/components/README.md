# Component Library - Atomic Design

This component library follows the **Atomic Design** methodology for maximum reusability and maintainability.

## Structure

```
src/components/
├── atoms/          # Smallest reusable UI elements
├── molecules/      # Simple combinations of atoms
├── organisms/      # Complex UI sections
├── templates/      # Page-level layouts
├── providers/      # React context providers
└── index.ts        # Barrel exports for easy imports
```

## Atomic Design Levels

### Atoms (`atoms/`)
The smallest, most fundamental UI components. These are typically single-purpose elements that can't be broken down further.

**Examples:**
- `StagingBanner` - A simple banner component

**When to create an atom:**
- Single-purpose UI element
- No dependencies on other components
- Highly reusable across the application
- Examples: buttons, inputs, labels, icons, badges

### Molecules (`molecules/`)
Simple combinations of atoms that function together as a unit. These components are still relatively simple but provide more functionality.

**Current components:**
- `AccountTabs` - Tab navigation for account pages
- `FoundryInstanceControl` - Controls for Foundry VTT instances
- `SubTabs` - Reusable sub-tab navigation component
- `UserMenu` - User dropdown menu
- `WorldAnvilLinkForm` - Form for linking World Anvil accounts

**When to create a molecule:**
- Combines 2-3 atoms
- Serves a single, focused purpose
- Can be reused in multiple contexts
- Examples: search bars, form fields with labels, card headers

### Organisms (`organisms/`)
Complex UI sections composed of molecules and/or atoms. These are substantial components that form distinct sections of the interface.

**Current components:**
- `AdminDashboardTabs` - Main admin dashboard tab navigation
- `CoreConceptsUI` - UI for managing core concepts
- `DiscordManagement` - Discord server management interface
- `FoundrySyncUI` - UI for Foundry VTT synchronization
- `Header` - Main application header (server component)
- `HeaderClient` - Client-side header logic
- `LinkedAccountsContent` - Content for linked accounts page
- `LinkedAccountsManager` - Manager for linked accounts
- `ProfileEditor` - User profile editing interface
- `SignUpForm` - User sign-up form
- `WebsiteManagement` - Website user management interface

**When to create an organism:**
- Combines multiple molecules and atoms
- Represents a major section of the UI
- Has complex internal logic
- Examples: navigation bars, data tables, forms with multiple fields

### Templates (`templates/`)
Page-level layouts that define the overall structure of pages. These are essentially organisms that provide the scaffolding for pages.

**Current components:**
- `PageLayout` - Standard page layout with header and content area

**When to create a template:**
- Defines page-level structure
- Used across multiple pages
- Composes organisms into a layout
- Examples: page layouts, modal containers, dashboard grids

## Usage

### Import from specific atomic levels:

```typescript
// Import from atoms
import { StagingBanner } from '@/components/atoms/StagingBanner'

// Import from molecules
import { SubTabs } from '@/components/molecules/SubTabs'
import { UserMenu } from '@/components/molecules/UserMenu'

// Import from organisms
import { Header } from '@/components/organisms/Header'
import { WebsiteManagement } from '@/components/organisms/WebsiteManagement'

// Import from templates
import { PageLayout } from '@/components/templates/PageLayout'
```

### Or use barrel exports:

```typescript
// Import multiple components from the same level
import { SubTabs, UserMenu, AccountTabs } from '@/components/molecules'
import { Header, WebsiteManagement } from '@/components/organisms'
import { PageLayout } from '@/components/templates'
```

## Benefits

1. **Scalability**: Easy to find and organize components as the project grows
2. **Reusability**: Components are designed to be reused across different contexts
3. **Maintainability**: Clear hierarchy makes it easy to understand dependencies
4. **Testing**: Each level can be tested independently
5. **Collaboration**: Team members can easily understand component relationships
6. **Consistency**: Encourages consistent UI patterns across the application

## Best Practices

1. **Start small**: Always try to use or create atoms first, then combine them into molecules
2. **Single responsibility**: Each component should have one clear purpose
3. **Loose coupling**: Components should depend on props, not specific implementations
4. **Documentation**: Add JSDoc comments explaining component purpose and usage
5. **TypeScript**: Always define proper interfaces for props
6. **Naming**: Use descriptive, action-oriented names (e.g., `SubTabs` not `Tabs`)

## Component Dependencies

- Atoms should have NO dependencies on other components
- Molecules should ONLY depend on atoms
- Organisms can depend on molecules and atoms
- Templates can depend on organisms, molecules, and atoms

## Future Improvements

As the component library grows, consider:
- Adding a Storybook for component documentation and testing
- Creating more atoms for common UI patterns
- Extracting shared styles into a theme system
- Adding unit tests for each component
- Creating a component playground for development
