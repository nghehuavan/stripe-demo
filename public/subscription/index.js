async function listAccounts() {
  setLoading(true);
  const response = await fetch('/accounts', {
    method: 'GET',
  });
  const accounts = await response.json();
  console.log('accounts ', accounts);

  let options = '<option value=""></option>';
  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    options += '<option value="' + acc.AccountID + '">' + acc.AccountName + '</option>';
  }
  document.getElementById('accounts').innerHTML = options;
  setLoading(false);
}

async function listProducts() {
  setLoading(true);
  const response = await fetch('/products', {
    method: 'GET',
  });
  const products = await response.json();
  console.log('products ', products);

  let options = '<option value=""></option>';
  for (let i = 0; i < products.data.length; i++) {
    const product = products.data[i];
    options += '<option value="' + product.id + '">' + product.name + '</option>';
  }
  document.getElementById('products').innerHTML = options;
  setLoading(false);
}

async function listPrices() {
  setLoading(true);
  let product_id = document.getElementById('products').value;
  const response = await fetch('/prices?product_id=' + product_id, {
    method: 'GET',
  });
  const prices = await response.json();
  console.log('prices ', prices);

  let options = '<option value=""></option>';
  for (let i = 0; i < prices.data.length; i++) {
    const price = prices.data[i];
    options += '<option value="' + price.id + '">' + (price.unit_amount / 100) + price.currency + '/' + price.recurring.interval + '</option>';
  }
  document.getElementById('prices').innerHTML = options;
  setLoading(false);
}

listAccounts();
listProducts();
