const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// This is your test secret API key.
const stripe = require('stripe')('sk_test_51HNUusFM58psI0fTpbMcoGBgYuYVjMEYK4FPadd5KWpcVvlr4I2Xk985qHALWc7JFlS2xwPaUPLSvnBOmmnUcci800NhWse0cX');

app.use(express.static('public'));
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const { order_id, currency, amount, description } = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: currency,
    automatic_payment_methods: {
      enabled: true,
    },
    description: description,
    metadata: {
      order_id: order_id,
    },
  });
  res.send({
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  });
});

app.listen(8080, () => console.log('Node server listening on port 8080!'));
