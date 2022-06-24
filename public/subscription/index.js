async function listAccounts() {
  const response = await fetch('/accounts', {
    method: 'GET',
  });
  const accounts = await response.json();
  console.log('accounts ', accounts);

  let options = '';
  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    options += '<option value="' + acc.AccountID + '">' + acc.AccountName + '</option>';
  }
  document.getElementById('account').innerHTML = options;
}
listAccounts();
