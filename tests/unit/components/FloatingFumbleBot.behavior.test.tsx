/**
 * Behavior tests for FloatingFumbleBot Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import React from 'react'

// Mock the @crit-fumble/react/web module
vi.mock('@crit-fumble/react/web', () => ({
  FumbleBotChat: ({ user, apiEndpoint, testId }: {
    user: { name: string; image: string | null }
    apiEndpoint: string
    testId: string
  }) => (
    <div data-testid={testId} data-user-name={user.name} data-api-endpoint={apiEndpoint}>
      Mock FumbleBot Chat
    </div>
  ),
}))

// Import after mocking
import { FloatingFumbleBot } from '@/components/FloatingFumbleBot'

describe('FloatingFumbleBot', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  it('should render null while loading', () => {
    // Never resolve the fetch to stay in loading state
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { container } = render(<FloatingFumbleBot />)

    expect(container.firstChild).toBeNull()
  })

  it('should render null when user is not logged in', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No user in session
    })

    const { container } = render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should render null when session request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    const { container } = render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should render null when fetch throws an error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { container } = render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('should render FumbleBotChat when user is logged in', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        },
      }),
    })

    render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(screen.getByTestId('floating-fumblebot')).toBeInTheDocument()
    })

    const chatComponent = screen.getByTestId('floating-fumblebot')
    expect(chatComponent).toHaveAttribute('data-user-name', 'Test User')
    expect(chatComponent).toHaveAttribute('data-api-endpoint', '/api/fumblebot/chat')
  })

  it('should use default name when user name is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          name: null,
          image: null,
        },
      }),
    })

    render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(screen.getByTestId('floating-fumblebot')).toBeInTheDocument()
    })

    expect(screen.getByTestId('floating-fumblebot')).toHaveAttribute('data-user-name', 'User')
  })

  it('should call the correct API endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'Test', image: null },
      }),
    })

    render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session')
    })
  })

  it('should only fetch session once on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { name: 'Test', image: null },
      }),
    })

    const { rerender } = render(<FloatingFumbleBot />)

    await waitFor(() => {
      expect(screen.getByTestId('floating-fumblebot')).toBeInTheDocument()
    })

    rerender(<FloatingFumbleBot />)

    // Should still only have been called once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
