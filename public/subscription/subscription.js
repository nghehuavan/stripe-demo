const stripe = Stripe(STRIPE_PUBLIC_KEY);

subscription = async () => {
  let accounts_idx = document.getElementById('accounts').selectedIndex - 1;
  let products_idx = document.getElementById('products').selectedIndex - 1;
  let prices_idx = document.getElementById('prices').selectedIndex - 1;
  // console.log(accounts_idx, products_idx, prices_idx);
  if (accounts_idx < 0 || products_idx < 0 || prices_idx < 0) {
    alert('please choose all dropdown');
    return;
  }
  setLoading(true);
  let account = accounts[accounts_idx];
  let product = products[products_idx];
  let price = prices[prices_idx];
  // console.log(account, product, price);

  // ensure create stripe-customer for account
  if (!account.customer_id) {
    const customer = await create_customer(account);
    account.customer_id = customer.id;
    console.log('customer', customer);
  }

  const subscription = await create_subscription(account.customer_id, price.id, account.Id);
  account.subscription_id = subscription.id;
  console.log('subscription', subscription);
  await render_payment_element(subscription);
};

async function render_payment_element(subscription) {
  const { id, clientSecret } = subscription;
  const appearance = {
    theme: 'stripe',
  };
  elements = stripe.elements({ appearance, clientSecret });

  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
  paymentElement.on('ready', function (event) {
    setLoading(false);
  });

  document.querySelector('#payment-form').classList.remove('hidden');
  document.querySelector('#btn-subscription').classList.add('hidden');

  document.querySelector('#payment-form').addEventListener('submit', handleSubmit);
}

async function create_customer(account) {
  const resp = await fetch('/create-customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  return await resp.json();
}

async function create_subscription(customer_id, price_id, account_id) {
  const resp = await fetch('/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id,
      customer_id,
      price_id,
    }),
  });
  return await resp.json();
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: window.location.origin + window.location.pathname + 'result.html',
    },
  });

  if (error) {
    // This point will only be reached if there is an immediate error when
    // confirming the payment. Show error to your customer (for example, payment
    // details incomplete)
    const messageContainer = document.querySelector('#error-message');
    messageContainer.textContent = error.message;
  } else {
    // Your customer will be redirected to your `return_url`. For some payment
    // methods like iDEAL, your customer will be redirected to an intermediate
    // site first to authorize the payment, then redirected to the `return_url`.
  }

  setLoading(false);
}
