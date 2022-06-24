let accounts = [],
  products = [],
  prices = [];

window.onload = function (e) {
  initialize();
};

initialize = async () => {
  await listAccounts();
  await listProducts();
};

async function listAccounts() {
  setLoading(true);
  const resp = await fetch('/accounts', {
    method: 'GET',
  });
  accounts = await resp.json();
  console.log('accounts ', accounts);

  let options = '<option value=""></option>';
  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    options += '<option value="' + acc.Id + '">' + acc.Name + ' (' + acc.Email + ')</option>';
  }
  document.getElementById('accounts').innerHTML = options;
  setLoading(false);
}

async function listProducts() {
  setLoading(true);
  const resp = await fetch('/products', {
    method: 'GET',
  });
  const json = await resp.json();
  products = json.data;
  console.log('products ', products);

  let options = '<option value=""></option>';
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    options += '<option value="' + product.id + '">' + product.name + '</option>';
  }
  document.getElementById('products').innerHTML = options;
  setLoading(false);
}

async function listPrices() {
  document.getElementById('prices').innerHTML = '';
  let product_id = document.getElementById('products').value;
  if (product_id) {
    setLoading(true);
    const resp = await fetch('/prices?product_id=' + product_id, {
      method: 'GET',
    });
    const json = await resp.json();
    prices = json.data;
    console.log('prices ', prices);

    let options = '<option value=""></option>';
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      options += '<option value="' + price.id + '">' + price.unit_amount / 100 + price.currency + '/' + price.recurring.interval + '</option>';
    }

    document.getElementById('prices').innerHTML = options;
    setLoading(false);
  }
}
