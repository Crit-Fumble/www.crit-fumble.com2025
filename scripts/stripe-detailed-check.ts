import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

async function checkStripePricesDetailed() {
  try {
    const productId = process.env.STRIPE_CRIT_COIN_PRODUCT_ID;

    if (!productId) {
      console.log('No STRIPE_CRIT_COIN_PRODUCT_ID in .env');
      return;
    }

    // Get all prices including inactive ones
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100
    });

    console.log('\nAll Prices for Crit-Coin Product:');
    console.log('==================================\n');

    // Sort by amount
    const sortedPrices = prices.data.sort((a, b) => {
      const amountA = a.unit_amount || 0;
      const amountB = b.unit_amount || 0;
      return amountA - amountB;
    });

    sortedPrices.forEach((price, index) => {
      const amount = price.unit_amount ? (price.unit_amount / 100) : 'N/A';
      console.log(`Price ${index + 1}:`);
      console.log('  Price ID:', price.id);
      console.log('  Amount: $' + amount);
      console.log('  Currency:', price.currency);
      console.log('  Active:', price.active);
      console.log('  Nickname:', price.nickname || 'None');
      console.log('  Created:', new Date(price.created * 1000).toISOString());
      console.log('  Metadata:', JSON.stringify(price.metadata, null, 4));
      console.log('  Product Description from Price:', price.product_data?.description);
      console.log('');
    });

    // Try to get the product to see if it has metadata about coin amounts
    const product = await stripe.products.retrieve(productId);
    console.log('Product Metadata:');
    console.log('=================');
    console.log(JSON.stringify(product.metadata, null, 2));
    console.log('\nProduct Default Price:', product.default_price);

  } catch (error) {
    console.error('Error fetching Stripe data:', error);
  }
}

checkStripePricesDetailed();
