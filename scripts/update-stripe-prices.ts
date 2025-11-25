import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

// Pricing with $250 max at 20% bonus
const PRICE_BUNDLES = [
  { priceUsd: 1, baseCoins: 1, bonusCoins: 0, totalCoins: 1 },      // 0% bonus
  { priceUsd: 10, baseCoins: 10, bonusCoins: 1, totalCoins: 11 },   // 10% bonus
  { priceUsd: 25, baseCoins: 25, bonusCoins: 3, totalCoins: 28 },   // 12% bonus
  { priceUsd: 50, baseCoins: 50, bonusCoins: 7, totalCoins: 57 },   // 14% bonus
  { priceUsd: 100, baseCoins: 100, bonusCoins: 16, totalCoins: 116 }, // 16% bonus
  { priceUsd: 200, baseCoins: 200, bonusCoins: 36, totalCoins: 236 }, // 18% bonus
  { priceUsd: 250, baseCoins: 250, bonusCoins: 50, totalCoins: 300 }, // 20% bonus
];

async function updateStripePrices() {
  try {
    const productId = process.env.STRIPE_CRIT_COIN_PRODUCT_ID;

    if (!productId) {
      console.log('No STRIPE_CRIT_COIN_PRODUCT_ID in .env');
      return;
    }

    console.log('Crit-Coin Bundles (Max 20% at $250):');
    console.log('=====================================\n');

    PRICE_BUNDLES.forEach((bundle) => {
      const bonusPercent = bundle.bonusCoins > 0
        ? ((bundle.bonusCoins / bundle.baseCoins) * 100).toFixed(0)
        : '0';

      console.log(`$${bundle.priceUsd.toString().padStart(3)} → ${bundle.totalCoins.toString().padStart(3)} coins (${bundle.baseCoins} + ${bundle.bonusCoins} bonus = ${bonusPercent}%)`);
    });

    console.log('\n\nFetching existing prices...\n');

    // Get existing prices
    const prices = await stripe.prices.list({
      product: productId,
      active: true
    });

    console.log(`Found ${prices.data.length} active prices\n`);

    // Map existing prices to bundles
    const priceMap = new Map();
    prices.data.forEach(price => {
      const amountUsd = (price.unit_amount || 0) / 100;
      priceMap.set(amountUsd, price);
    });

    console.log('Updating price metadata...\n');

    // Update each price with metadata
    for (const bundle of PRICE_BUNDLES) {
      const existingPrice = priceMap.get(bundle.priceUsd);

      const bonusPercent = bundle.bonusCoins > 0
        ? Math.round((bundle.bonusCoins / bundle.baseCoins) * 100)
        : 0;

      if (existingPrice) {
        console.log(`Updating $${bundle.priceUsd} price (${existingPrice.id})...`);

        await stripe.prices.update(existingPrice.id, {
          metadata: {
            coins: bundle.totalCoins.toString(),
            base_coins: bundle.baseCoins.toString(),
            bonus_coins: bundle.bonusCoins.toString(),
            bonus_percentage: bonusPercent.toString()
          },
          nickname: bundle.bonusCoins > 0
            ? `${bundle.totalCoins} Crit-Coins (+${bundle.bonusCoins} bonus)`
            : `${bundle.totalCoins} Crit-Coin`
        });

        console.log(`  ✅ Updated with ${bundle.totalCoins} coins (${bonusPercent}% bonus)\n`);
      } else {
        console.log(`Creating new price for $${bundle.priceUsd}...`);

        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: bundle.priceUsd * 100, // Convert to cents
          currency: 'usd',
          nickname: bundle.bonusCoins > 0
            ? `${bundle.totalCoins} Crit-Coins (+${bundle.bonusCoins} bonus)`
            : `${bundle.totalCoins} Crit-Coin`,
          metadata: {
            coins: bundle.totalCoins.toString(),
            base_coins: bundle.baseCoins.toString(),
            bonus_coins: bundle.bonusCoins.toString(),
            bonus_percentage: bonusPercent.toString()
          }
        });

        console.log(`  ✅ Created new price: ${newPrice.id}\n`);
      }
    }

    console.log('\n✅ All prices updated successfully!\n');

    // Display final pricing table
    console.log('\nFinal Pricing Table:');
    console.log('====================\n');
    console.log('| Price  | Base | Bonus | Total | Bonus % | Effective Rate |');
    console.log('|--------|------|-------|-------|---------|----------------|');

    PRICE_BUNDLES.forEach(bundle => {
      const bonusPercent = bundle.bonusCoins > 0
        ? Math.round((bundle.bonusCoins / bundle.baseCoins) * 100)
        : 0;
      const effectiveRate = (bundle.priceUsd / bundle.totalCoins).toFixed(3);

      console.log(`| $${bundle.priceUsd.toString().padEnd(5)} | ${bundle.baseCoins.toString().padEnd(4)} | ${bundle.bonusCoins.toString().padEnd(5)} | ${bundle.totalCoins.toString().padEnd(5)} | ${bonusPercent.toString().padEnd(7)}% | $${effectiveRate}/coin    |`);
    });

    console.log('\n');

  } catch (error) {
    console.error('Error updating Stripe prices:', error);
  }
}

updateStripePrices();
