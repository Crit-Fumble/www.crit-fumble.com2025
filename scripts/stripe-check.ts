import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

async function checkStripeProducts() {
  try {
    // Get the Crit-Coin product
    const productId = process.env.STRIPE_CRIT_COIN_PRODUCT_ID;

    if (!productId) {
      console.log('No STRIPE_CRIT_COIN_PRODUCT_ID in .env');
      return;
    }

    console.log('Fetching product:', productId);
    const product = await stripe.products.retrieve(productId);
    console.log('\nProduct Details:');
    console.log('================');
    console.log('ID:', product.id);
    console.log('Name:', product.name);
    console.log('Description:', product.description);
    console.log('Active:', product.active);
    console.log('Metadata:', product.metadata);

    // Get associated prices
    console.log('\nFetching prices for this product...');
    const prices = await stripe.prices.list({
      product: productId,
      active: true
    });

    console.log('\nPrices:');
    console.log('=======');
    prices.data.forEach((price, index) => {
      console.log(`\nPrice ${index + 1}:`);
      console.log('  ID:', price.id);
      console.log('  Amount:', price.unit_amount ? (price.unit_amount / 100) : 'N/A');
      console.log('  Currency:', price.currency);
      console.log('  Type:', price.type);
      console.log('  Nickname:', price.nickname);
      console.log('  Metadata:', price.metadata);
    });

  } catch (error) {
    console.error('Error fetching Stripe data:', error);
  }
}

checkStripeProducts();
