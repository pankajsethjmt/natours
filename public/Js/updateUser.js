/* eslint-disable */

import axios from 'axios';

import { showAlerts } from './alerts';

export const updateMe = async (name, email) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      data: {
        name,
        email,
      },
    });

    if (res.data.message === 'success') {
      showAlerts('success', 'You are Successful update');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1500);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message);
  }
};
