/* eslint-disable */

import axios from 'axios';
import { showAlerts } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.message === 'success') {
      showAlerts('success', 'You are Successful login');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message);
  }
};

export const logOut = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.message === 'success') location.reload(true);
  } catch (err) {
    showAlerts('error', 'Error logging out');
  }
};
