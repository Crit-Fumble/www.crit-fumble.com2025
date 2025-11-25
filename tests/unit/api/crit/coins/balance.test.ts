import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/crit/coins/balance/route';
import { prismaMock } from '../../../setup';

describe('GET /api/crit/coins/balance', () => {
  it('should return 400 if userId is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/crit/coins/balance');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return balance of 0 for user with no transactions', async () => {
    const userId = 'test-user-123';
    const request = new NextRequest(`http://localhost:3000/api/crit/coins/balance?userId=${userId}`);

    // Mock Prisma to return no transactions
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue(null);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      balance: 0,
      balanceUsd: '0.00',
      lastUpdated: null,
    });

    expect(prismaMock.critCoinTransaction.findFirst).toHaveBeenCalledWith({
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
    const request = new NextRequest(`http://localhost:3000/api/crit/coins/balance?userId=${userId}`);

    // Mock Prisma to return a transaction with balance of 5000 (=$5.00)
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: 5000,
      createdAt: mockDate,
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      balance: 5000,
      balanceUsd: '5.00',
      lastUpdated: mockDate.toISOString(),
    });
  });

  it('should return 500 if database query fails', async () => {
    const userId = 'test-user-789';
    const request = new NextRequest(`http://localhost:3000/api/crit/coins/balance?userId=${userId}`);

    // Mock Prisma to throw an error
    prismaMock.critCoinTransaction.findFirst.mockRejectedValue(
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

  it('should handle fractional balances correctly', async () => {
    const userId = 'test-user-decimal';
    const request = new NextRequest(`http://localhost:3000/api/crit/coins/balance?userId=${userId}`);

    // Mock Prisma to return balance with decimals (12345 = $12.35)
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: 12345,
      createdAt: new Date(),
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.balance).toBe(12345);
    expect(data.balanceUsd).toBe('12.35');
  });
});
