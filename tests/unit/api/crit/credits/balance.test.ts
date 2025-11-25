import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/crit/credits/balance/route';
import { prismaMock } from '../../../setup';
import { Decimal } from '@prisma/client/runtime/library';

describe('GET /api/crit/credits/balance', () => {
  it('should return 400 if userId is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/crit/credits/balance');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return balance of 0 for user with no transactions', async () => {
    const userId = 'test-user-123';
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock Prisma to return no transactions
    prismaMock.storyCreditTransaction.findFirst.mockResolvedValue(null);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      balance: 0,
      balanceUsd: '0.00',
      critCoinsEquivalent: 0,
      canCashOut: false,
      canConvert: false,
      lastUpdated: null,
    });

    expect(prismaMock.storyCreditTransaction.findFirst).toHaveBeenCalledWith({
      where: { playerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        balanceAfter: true,
        createdAt: true,
      },
    });
  });

  it('should return correct balance for user with transactions', async () => {
    const userId = 'test-user-456';
    const mockDate = new Date('2025-01-01T12:00:00Z');
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock Prisma to return a transaction with balance of 5000 credits (=$50.00, 50000 Crit-Coins)
    prismaMock.storyCreditTransaction.findFirst.mockResolvedValue({
      balanceAfter: new Decimal(5000),
      createdAt: mockDate,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      balance: 5000,
      balanceUsd: '50.00',
      critCoinsEquivalent: 50000,
      canCashOut: true, // >= 1000 credits
      canConvert: true, // >= 100 credits
      lastUpdated: mockDate.toISOString(),
    });
  });

  it('should return 500 if database query fails', async () => {
    const userId = 'test-user-789';
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock Prisma to throw an error
    prismaMock.storyCreditTransaction.findFirst.mockRejectedValue(
      new Error('Database connection failed')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch balance');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should correctly calculate cash-out and convert eligibility', async () => {
    const userId = 'test-user-min';
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock balance of exactly 1000 credits (minimum for cash-out)
    prismaMock.storyCreditTransaction.findFirst.mockResolvedValue({
      balanceAfter: new Decimal(1000),
      createdAt: new Date(),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.balance).toBe(1000);
    expect(data.balanceUsd).toBe('10.00');
    expect(data.critCoinsEquivalent).toBe(10000);
    expect(data.canCashOut).toBe(true); // Exactly at threshold
    expect(data.canConvert).toBe(true);
  });

  it('should handle balance below cash-out threshold', async () => {
    const userId = 'test-user-below';
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock balance of 999 credits (below cash-out threshold)
    prismaMock.storyCreditTransaction.findFirst.mockResolvedValue({
      balanceAfter: new Decimal(999),
      createdAt: new Date(),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.balance).toBe(999);
    expect(data.canCashOut).toBe(false); // Below 1000
    expect(data.canConvert).toBe(true); // Still above 100
  });

  it('should handle balance below convert threshold', async () => {
    const userId = 'test-user-minimal';
    const request = new NextRequest(`http://localhost:3000/api/crit/credits/balance?userId=${userId}`);

    // Mock balance of 50 credits (below convert threshold)
    prismaMock.storyCreditTransaction.findFirst.mockResolvedValue({
      balanceAfter: new Decimal(50),
      createdAt: new Date(),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.balance).toBe(50);
    expect(data.canCashOut).toBe(false); // Below 1000
    expect(data.canConvert).toBe(false); // Below 100
  });
});
