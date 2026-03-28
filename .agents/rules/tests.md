---
trigger: always_on
---

## Testing Guidelines

> **Note:** Jest and React Native Testing Library are **not yet installed**. These guidelines define the intended setup. Install test infra before writing tests.

- File naming: `component-name.test.tsx` (co-located with component)
- Import test utils from `@/src/lib/test-utils` (provides `setup`, `cleanup`, `screen`, `waitFor`)
- Use `testID` props for reliable element selection
- Avoid testing implementation details
- Avoid multiple assertions inside `waitFor`

## Test Structure

```tsx
import React from 'react';
import { cleanup, screen, setup, waitFor } from '@/src/lib/test-utils';
afterEach(cleanup);
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Rendering', () => {
    test('renders correctly', async () => {
      setup(<ComponentName />);
      expect(await screen.findByTestId('component-name')).toBeOnTheScreen();
    });
  });
  describe('Interactions', () => {
    test('handles user input', async () => {
      const { user } = setup(<ComponentName />);
      await user.type(screen.getByTestId('input-id'), 'test');
    });
  });
});

Run Tests
bun test <component-name> -- --coverage --coverageReporters="text"
```
