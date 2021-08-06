const express = require('express');
const friendRouter = require('./friendRoutes');

const {
  authController: {
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    restrictTo
  },
  userController: {
    getAllUsers,
    getUser,
    updateUser,
    createUser,
    deleteUser,
    updateMe,
    deleteMe
  }
} = require('../controllers');

const router = express.Router();

router.use('/friends', friendRouter);

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').patch(resetPassword);

router.route('/updateMyPassword').patch(protect, updatePassword);
router.route('/updateMe').patch(protect, updateMe);
router.route('/deleteMe').delete(protect, deleteMe);

router.route('/').get(getAllUsers).post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(protect, restrictTo('admin'), deleteUser);

module.exports = router;
