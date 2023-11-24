/* eslint-disable */

import { login, logOut } from './login';

import { updateMe, updateSetting } from './updateData';

import { displayMap } from './mapbox';

import { bookTour } from './stripe';
import { showAlert } from './alerts';

// console.log('Hello world');

const loginForm = document.querySelector('.form--login');
const updateForm = document.querySelector('.form-user-data');
const updateSettingF = document.querySelector('.form-user-settings');
const mapDiv = document.getElementById('map');
const logOutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (mapDiv) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (logOutBtn) logOutBtn.addEventListener('click', logOut);

if (updateForm)
  updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('email', document.getElementById('email').value);
    form.append('name', document.getElementById('name').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateMe(form);
  });

if (updateSettingF)
  updateSettingF.addEventListener('submit', (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordconfirm =
      document.getElementById('password-confirm').value;
    updateSetting(oldPassword, newPassword, newPasswordconfirm);
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;

    bookTour(tourId);
  });
