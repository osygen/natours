/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

// export const login = async (email, password) => {
//   try {
//     const result = await axios({
//       method: 'post',
//       url: '/api/v1/users/login',
//       data: { email, password }
//     });

//     if (result.data.status === 'success')
//       setTimeout(() => {
//         showAlert('success', 'Logged in successfully');
//         setTimeout(() => {
//           location.assign('/');
//         }, 2500);
//       }, 500);
//   } catch (error) {
//     showAlert('error', error.response.data.message);
//   }
// };

// export const logout = async () => {
//   try {
//     const result = await axios({
//       method: 'get',
//       url: '/api/v1/users/logout'
//     });

//     if (result.data.status === 'success') location.assign('/');
//   } catch (error) {
//     showAlert('error', error.response.data.message);
//   }
// };

//////////
export const logger = (action) => {
  const actions = {
    login: async (email, password) => {
      try {
        const result = await axios({
          method: 'post',
          url: '/api/v1/users/login',
          data: { email, password }
        });

        if (result.data.status === 'success')
          setTimeout(() => {
            showAlert('success', 'Logged in successfully');
            setTimeout(() => {
              location.assign('/');
            }, 2400);
          }, 200);
      } catch (error) {
        showAlert('error', error.response.data.message);
      }
    },

    logout: async () => {
      try {
        const result = await axios({
          method: 'get',
          url: '/api/v1/users/logout'
        });

        if (result.data.status === 'success') location.assign('/');
      } catch (error) {
        showAlert('error', error.response.data.message);
      }
    }
  };
  if (!actions[action])
    console.error(
      `\"${action}\" is not a key.\nAllowed key strings are:\n${Object.keys(
        actions
      )
        .map((w, i) => `[${i + 1}] \'${w}\'`)
        .join('\n')}`
    );
  return actions[action];
};
