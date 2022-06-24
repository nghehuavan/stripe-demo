// This is your test publishable API key.
var STRIPE_PUBLIC_KEY='pk_test_51HNUusFM58psI0fTpmVDxgBhqmPDyq83iURVuzx4841ZuIrfwoeHQZYQLF8rjKSkQtp9pfWqeJnv0VWWC2M79D1l00N3IFbij1';

function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector('#loading').classList.remove('hidden');
  } else {
    document.querySelector('#loading').classList.add('hidden');
  }
}