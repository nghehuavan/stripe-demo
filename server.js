// This is your test secrect API key.
const stripe_secrect_key = 'sk_test_51HNUusFM58psI0fTpbMcoGBgYuYVjMEYK4FPadd5KWpcVvlr4I2Xk985qHALWc7JFlS2xwPaUPLSvnBOmmnUcci800NhWse0cX';

// This is your test webhook signing secret.
const stripe_webhook_signing_secret = '';

var sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// This is your test secret API key.
const stripe = require('stripe')(stripe_secrect_key);

app.use(express.static('public'));
app.use(express.json());

//*****************************************************************************
//=============================== CHECK-OUT ===================================
//*****************************************************************************
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

//*****************************************************************************
//=============================== SUBSCRIPTION ================================
//*****************************************************************************
var db = new sqlite3.Database('./database.sqlite');

// account list from database
app.get('/accounts', async (req, res) => {
  db.all('SELECT * FROM Account', function (err, rows, fields) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(rows));
  });
});

app.get('/products', async (req, res) => {
  const products = await stripe.products.list({
    limit: 10,
    active: true,
  });

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(products));
});

app.get('/prices', async (req, res) => {
  const { product_id } = req.query;
  const prices = await stripe.prices.list({
    limit: 10,
    type: 'recurring',
    active: true,
    product: product_id,
  });

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(prices));
});

//*****************************************************************************
//================================== WEBHOOK ==================================
//*****************************************************************************

app.listen(8080, () => console.log('Node server listening on [http://localhost:8080]'));
