# Custom React Hooks

This directory contains reusable custom React hooks used throughout the application. All hooks are exported from the barrel `index.ts` file for convenient importing.

## Usage

Import hooks from the centralized export:

```tsx
import { useTheme, useClickOutside, useToggle } from '@/hooks'
```

## Available Hooks

### `useTheme()`

Manages theme state (dark/light mode) with localStorage persistence and system preference detection.

**Returns:**
- `isDarkMode` (boolean) - Current theme state
- `toggleTheme` (function) - Function to toggle between dark and light mode

**Example:**
```tsx
const { isDarkMode, toggleTheme } = useTheme()

<button onClick={toggleTheme}>
  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
</button>
```

---

### `useClickOutside(ref, handler, enabled)`

Detects clicks outside of a referenced element and executes a callback.

**Parameters:**
- `ref` (RefObject) - React ref pointing to the element to monitor
- `handler` (function) - Callback to execute when click outside is detected
- `enabled` (boolean, optional) - Whether the hook is active (default: true)

**Example:**
```tsx
const menuRef = useRef<HTMLDivElement>(null)
const [isOpen, setIsOpen] = useState(false)

useClickOutside(menuRef, () => setIsOpen(false), isOpen)

<div ref={menuRef}>
  {/* Menu content */}
</div>
```

---

### `useToggle(initialValue)`

Manages boolean toggle state with convenient helper functions.

**Parameters:**
- `initialValue` (boolean, optional) - Initial value (default: false)

**Returns:** `[value, toggle, setTrue, setFalse, setValue]`
- `value` (boolean) - Current boolean value
- `toggle` (function) - Toggle the value
- `setTrue` (function) - Set value to true
- `setFalse` (function) - Set value to false
- `setValue` (function) - Set value directly

**Example:**
```tsx
const [isOpen, toggleOpen, openMenu, closeMenu] = useToggle(false)

<button onClick={toggleOpen}>Toggle</button>
<button onClick={openMenu}>Open</button>
<button onClick={closeMenu}>Close</button>
```

---

### `useApiMutation()`

Manages state for API mutation operations (POST, PATCH, DELETE, etc.) with loading, error, and success states.

**Returns:**
- `data` (T | null) - Response data from successful mutation
- `error` (string | null) - Error message if mutation failed
- `isLoading` (boolean) - Whether mutation is in progress
- `isSuccess` (boolean) - Whether mutation completed successfully
- `isError` (boolean) - Whether mutation failed
- `mutate` (function) - Function to execute the mutation
- `reset` (function) - Function to reset state

**Example:**
```tsx
const { mutate, isLoading, error, data } = useApiMutation<User>()

const handleSubmit = async () => {
  try {
    await mutate(async () => {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    })
    // Success handling
  } catch (err) {
    // Error already stored in error state
  }
}
```

---

### `useSearch(items, searchFields, initialQuery)`

Manages search/filter functionality for a list of items with memoized results.

**Parameters:**
- `items` (T[]) - Array of items to search through
- `searchFields` (function) - Function to extract searchable fields from an item
- `initialQuery` (string, optional) - Initial search query (default: '')

**Returns:**
- `query` (string) - Current search query
- `setQuery` (function) - Function to update search query
- `filteredItems` (T[]) - Filtered items matching the query

**Example:**
```tsx
const { query, setQuery, filteredItems } = useSearch(
  users,
  (user) => [user.name, user.email, user.username]
)

<input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search users..."
/>

{filteredItems.map(user => (
  <div key={user.id}>{user.name}</div>
))}
```

---

### `useTabState(initialTab)`

Type-safe hook for managing tab state.

**Parameters:**
- `initialTab` (T extends string) - Initial active tab

**Returns:** `[activeTab, setActiveTab]`

**Example:**
```tsx
type TabId = 'profile' | 'settings' | 'security'
const [activeTab, setActiveTab] = useTabState<TabId>('profile')

<button onClick={() => setActiveTab('settings')}>Settings</button>
```

---

### `useFormState(initialValues)`

Manages form state with automatic change handlers for inputs.

**Parameters:**
- `initialValues` (T extends Record<string, any>) - Object with initial form values

**Returns:**
- `values` (T) - Current form values
- `handleChange` (function) - Change handler for inputs
- `setValue` (function) - Set individual field value
- `setValues` (function) - Set all values at once
- `reset` (function) - Reset to initial values

**Example:**
```tsx
const { values, handleChange, reset } = useFormState({
  username: '',
  email: '',
  bio: ''
})

<input
  name="username"
  value={values.username}
  onChange={handleChange}
/>
<input
  name="email"
  value={values.email}
  onChange={handleChange}
/>
<button onClick={reset}>Reset</button>
```

---

## Adding New Hooks

When creating a new custom hook:

1. Create a new file in `src/hooks/` (e.g., `useMyHook.ts`)
2. Add comprehensive JSDoc comments documenting:
   - Purpose and functionality
   - Parameters with types
   - Return values with types
   - Usage examples
3. Export the hook from `index.ts`
4. Update this README with documentation

**Template:**
```typescript
import { useState } from 'react'

/**
 * Brief description of what the hook does
 *
 * @param param1 - Description of parameter
 * @returns Description of return value
 *
 * @example
 * ```tsx
 * const result = useMyHook(initialValue)
 * ```
 */
export function useMyHook(param1: string) {
  // Implementation
}
```

## Best Practices

1. **Keep hooks focused** - Each hook should have a single, well-defined purpose
2. **Document thoroughly** - Include JSDoc comments and usage examples
3. **Type everything** - Use TypeScript for all parameters and return values
4. **Test edge cases** - Consider error states, loading states, and cleanup
5. **Follow naming conventions** - All hooks must start with `use`
6. **Optimize with useMemo/useCallback** - Prevent unnecessary re-renders
