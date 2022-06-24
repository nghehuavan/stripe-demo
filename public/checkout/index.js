const stripe = Stripe(STRIPE_PUBLIC_KEY);

const reqBody = {
  order_id: 6789,
  currency: 'usd',
  amount: 99,
  description: 'nghe.huavan@gmail.com pay for order: 6789',
};
document.getElementById('payment-message').innerHTML = '<pre>' + JSON.stringify(reqBody, null, 4) + '</pre>';

checkout = () => {
  initialize();

  document.querySelector('#payment-form').addEventListener('submit', handleSubmit);
};

// Fetches a payment intent and captures the client secret
let elements;
async function initialize() {
  setLoading(true);
  const response = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });
  const { id, clientSecret } = await response.json();
  // console.log('response ', id, clientSecret);
  const appearance = {
    theme: 'stripe',
  };
  elements = stripe.elements({ appearance, clientSecret });

  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');
  paymentElement.on('ready', function (event) {
    setLoading(false);
  });
  document.querySelector('#submit').classList.remove('hidden');
  document.querySelector('#btn-checkout').classList.add('hidden');
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

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === 'card_error' || error.type === 'validation_error') {
    showMessage(error.message);
  } else {
    showMessage('An unexpected error occurred.');
  }

  setLoading(false);
}

// ------- UI helpers -------
function showMessage(messageText) {
  const messageContainer = document.querySelector('#payment-message');

  messageContainer.classList.remove('hidden');
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add('hidden');
    messageText.textContent = '';
  }, 4000);
}

