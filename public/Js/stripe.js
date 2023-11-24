/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alerts';

import { loadStripe } from '@stripe/stripe-js';

export const bookTour = async (tourId) => {
  const stripe = await loadStripe(
    'pk_test_51O6dOSSJfU3feLnFqkAZTQ6V1yOmjYmI6p7bci6ZgpyJU54HXYIdsElT88fyvuRboZ5GeK3zYfkpA9FOYzpPNNZj00felEmlKT'
  );
  // console.log(tourId);

  const response = await axios.get(
    `/api/v1/booking/checkout-session/${tourId}`
  );
  const session = response.data.session;
  await stripe.redirectToCheckout({
    sessionId: session.id,
  });
};
