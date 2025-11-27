import { NextRequest, NextResponse } from 'next/server';
import { prismaMain } from '@/lib/db';
import { prisma } from '@/lib/db';

/**
 * GET /api/crit/products
 * Get available Crit-Coin packages for purchase
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType') || 'crit_coins';
    const products = await prismaMain.critProduct.findMany({
      where: {
        productType,
        isActive: true,
        deletedAt: null
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        title: true,
        description: true,
        productType: true,
        priceUsd: true,
        priceCritCoins: true,
        critCoinAmount: true,
        isFeatured: true,
        features: true,
        imageUrl: true,
        stripeProductId: true,
        stripePriceId: true
      }
    });
    // Calculate bonus percentage for each product
    const productsWithBonus = products.map((product) => {
      if (product.critCoinAmount && product.priceUsd) {
        const baseRate = 1000; // 1,000 coins per $1
        const expectedCoins = Number(product.priceUsd) * baseRate;
        const bonusCoins = product.critCoinAmount - expectedCoins;
        const bonusPercentage = (bonusCoins / expectedCoins) * 100;
        return {
          ...product,
          bonusCoins: bonusCoins > 0 ? bonusCoins : 0,
          bonusPercentage: bonusPercentage > 0 ? Math.round(bonusPercentage) : 0,
          effectiveRate: product.critCoinAmount / Number(product.priceUsd)
        };
      return product;
    return NextResponse.json({
      products: productsWithBonus,
      baseRate: 1000, // 1,000 Crit-Coins = $1.00
      message: 'Buy more, get bonus coins!'
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
 * POST /api/crit/products
 * Create a new Crit-Coin product package (admin only)
export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
      sku,
      name,
      title,
      description,
      productType,
      priceUsd,
      critCoinAmount,
      isFeatured,
      features,
      imageUrl,
      stripeProductId,
      stripePriceId,
      displayOrder
    } = body;
    // Validate required fields
    if (!sku || !name || !title || !productType || !priceUsd || !critCoinAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Check for duplicate SKU
    const existing = await prismaMain.critProduct.findUnique({
      where: { sku }
    if (existing) {
        { error: 'Product with this SKU already exists' },
    const product = await prismaMain.critProduct.create({
      data: {
        sku,
        name,
        title,
        description: description || null,
        priceUsd,
        critCoinAmount,
        isFeatured: isFeatured || false,
        features: features || [],
        imageUrl: imageUrl || null,
        stripeProductId: stripeProductId || null,
        stripePriceId: stripePriceId || null,
        displayOrder: displayOrder || 0
      product,
      message: 'Product created successfully'
    console.error('Error creating product:', error);
      { error: 'Failed to create product' },
