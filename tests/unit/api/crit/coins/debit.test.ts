import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/crit/coins/debit/route';
import { prismaMock } from '../../../setup';

describe('POST /api/crit/coins/debit', () => {
  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test-user' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields: userId, amount, description');
  });

  it('should return 400 if amount is not positive', async () => {
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-user',
        amount: -100,
        description: 'Test debit',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Amount must be positive');
  });

  it('should return 400 if insufficient balance', async () => {
    const userId = 'test-user-123';
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: 1000,
        description: 'Test debit',
      }),
    });

    // Mock current balance of 500
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: 500,
      createdAt: new Date(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Insufficient balance');
    expect(data.currentBalance).toBe(500);
    expect(data.requestedAmount).toBe(1000);
    expect(data.shortfall).toBe(500);
  });

  it('should successfully debit coins when balance is sufficient', async () => {
    const userId = 'test-user-456';
    const currentBalance = 5000;
    const debitAmount = 1000;
    const description = 'Foundry instance usage';

    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: debitAmount,
        description,
        metadata: { instanceId: 'test-123' },
      }),
    });

    // Mock current balance
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: currentBalance,
      createdAt: new Date(),
    });

    // Mock transaction creation
    const mockTransaction = {
      id: 'tx-123',
      playerId: userId,
      transactionType: 'debit',
      amount: -debitAmount,
      balanceAfter: currentBalance - debitAmount,
      description,
      metadata: { instanceId: 'test-123' },
      createdAt: new Date(),
    };
    prismaMock.critCoinTransaction.create.mockResolvedValue(mockTransaction);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.previousBalance).toBe(currentBalance);
    expect(data.newBalance).toBe(4000);
    expect(data.amountDebited).toBe(debitAmount);
    expect(data.transaction.id).toBe(mockTransaction.id);
    expect(data.transaction.playerId).toBe(userId);
    expect(data.transaction.amount).toBe(-debitAmount);
    expect(data.transaction.balanceAfter).toBe(4000);

    // Verify transaction was created with correct data
    expect(prismaMock.critCoinTransaction.create).toHaveBeenCalledWith({
      data: {
        playerId: userId,
        transactionType: 'debit',
        amount: -debitAmount,
        balanceAfter: 4000,
        description,
        metadata: { instanceId: 'test-123' },
      },
    });
  });

  it('should handle user with no previous transactions (zero balance)', async () => {
    const userId = 'test-user-new';
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: 100,
        description: 'Test debit',
      }),
    });

    // Mock no previous transactions
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue(null);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Insufficient balance');
    expect(data.currentBalance).toBe(0);
    expect(data.shortfall).toBe(100);
  });

  it('should allow exact balance debit (balance becomes zero)', async () => {
    const userId = 'test-user-exact';
    const currentBalance = 1000;

    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: 1000,
        description: 'Withdraw all',
      }),
    });

    // Mock current balance
    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: currentBalance,
      createdAt: new Date(),
    });

    // Mock transaction creation
    const mockTransaction = {
      id: 'tx-456',
      playerId: userId,
      transactionType: 'debit',
      amount: -1000,
      balanceAfter: 0,
      description: 'Withdraw all',
      metadata: {},
      createdAt: new Date(),
    };
    prismaMock.critCoinTransaction.create.mockResolvedValue(mockTransaction);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.newBalance).toBe(0);
    expect(data.previousBalance).toBe(1000);
  });

  it('should return 500 if database query fails', async () => {
    const userId = 'test-user-error';
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: 100,
        description: 'Test debit',
      }),
    });

    // Mock database error
    prismaMock.critCoinTransaction.findFirst.mockRejectedValue(
      new Error('Database connection failed')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to debit coins');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle metadata correctly when not provided', async () => {
    const userId = 'test-user-no-meta';
    const request = new NextRequest('http://localhost:3000/api/crit/coins/debit', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        amount: 50,
        description: 'Simple debit',
      }),
    });

    prismaMock.critCoinTransaction.findFirst.mockResolvedValue({
      balanceAfter: 1000,
      createdAt: new Date(),
    });

    const mockTransaction = {
      id: 'tx-789',
      playerId: userId,
      transactionType: 'debit',
      amount: -50,
      balanceAfter: 950,
      description: 'Simple debit',
      metadata: {},
      createdAt: new Date(),
    };
    prismaMock.critCoinTransaction.create.mockResolvedValue(mockTransaction);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.critCoinTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: {},
      }),
    });
  });
});
