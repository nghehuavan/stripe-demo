// This is your test secrect API key.
const STRIPE_SECRECT_KEY = 'sk_test_51HNUusFM58psI0fTpbMcoGBgYuYVjMEYK4FPadd5KWpcVvlr4I2Xk985qHALWc7JFlS2xwPaUPLSvnBOmmnUcci800NhWse0cX';
// This is your test Stripe CLI webhook signing secret.
const STRIPE_WEBHOOK_SIGNING_SECRET = 'whsec_ab1668074eab3c131ce0cb0c9f4bb6ef76e3163a1e044278d019b8016ba5705c';
const WEBHOOK_PATH = '/webhook';

var sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// middleware use raw req.body for /webhook, JSON req.body for other path
app.use((req, res, next) => {
  if (req.originalUrl === WEBHOOK_PATH) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const stripe = require('stripe')(STRIPE_SECRECT_KEY);
app.use(express.static('public'));

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

// product list from stripe
app.get('/products', async (req, res) => {
  const products = await stripe.products.list({
    limit: 10,
    active: true,
  });

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(products));
});

// price list from stripe
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

// create customer
app.post('/create-customer', async (req, res) => {
  const { Id, Email, Name } = req.body;
  // console.log(Id, Email, Name);
  const customer = await stripe.customers.create({
    email: Email,
    name: Name,
  });

  if (Id && customer && customer.id) {
    await update_customer_id(customer.id, Id);
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(customer));
});

update_customer_id = async (customer_id, account_id) => {
  var params = [customer_id, account_id];
  db.run('UPDATE Account SET customer_id=? WHERE Id=?', params, function (err, rows) {});
};

// create subscription
app.post('/create-subscription', async (req, res) => {
  const { customer_id, price_id, account_id } = req.body;
  try {
    // Create the subscription. Note we're expanding the Subscription's
    // latest invoice and that invoice's payment_intent
    // so we can pass it to the front end to confirm the payment
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [
        {
          price: price_id,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    // console.log(subscription);
    if (account_id && subscription && subscription.id) {
      await update_subscription_id(subscription.id, 'incomplete', account_id);
    }

    res.send({
      id: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    return res.status(400).send({ error: { message: error.message } });
  }
});

update_subscription_id = async (subscription_id, subscription_status, account_id) => {
  var params = [subscription_id, subscription_status, account_id];
  db.run('UPDATE Account SET subscription_id=?, subscription_status=? WHERE Id=?', params, function (err, rows) {});
};

//*****************************************************************************
//================================== WEBHOOK ==================================
//*****************************************************************************
app.post(WEBHOOK_PATH, express.raw({ type: 'application/json' }), async (req, resp) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SIGNING_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`);
    resp.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const dataObject = event.data.object;
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      var { customer: customer_id, id: subscription_id, status: subscription_status } = dataObject;
      // console.log(customer_id, subscription_id, subscription_status);
      await update_subscription_status(subscription_status, subscription_id, customer_id);
      break;
    default:
    // Unexpected event type
  }
  resp.sendStatus(200);
});

update_subscription_status = async (subscription_status, subscription_id, customer_id) => {
  var params = [subscription_status, subscription_id, customer_id];
  db.run('UPDATE Account SET subscription_status=? WHERE subscription_id=? AND customer_id=?', params, function (err, rows) {});
};

app.listen(8080, () => console.log('Node server listening on [http://localhost:8080]'));
