/* eslint-disable */

import axios from 'axios';
import { showAlerts } from './alerts';

export const updateMe = async (data) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      data: data,
    });

    if (res.data.message === 'success') {
      showAlerts('success', 'You are Successful update');
      window.setTimeout(() => {
        location.reload('/me');
      }, 1500);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message);
  }
};

export const updateSetting = async (
  oldPassword,
  newPassword,
  newPasswordconfirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMyPassword',
      data: {
        oldPassword,
        newPassword,
        newPasswordconfirm,
      },
    });

    if (res.data.message === 'success') {
      showAlerts('success', 'You are Successful update');
      window.setTimeout(() => {
        location.reload('/me');
      }, 1500);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message);
  }
};
