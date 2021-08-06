/* eslint-disable */
import '@babel/polyfill';
import { login, logout, logger } from './login';

document.querySelector('.form')?.addEventListener('submit', (s) => {
  s.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  logger('login')(email, password);
});

document
  .querySelector('.nav__el--logout')
  ?.addEventListener('click', logger('logout'));
