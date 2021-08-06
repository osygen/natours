const express = require('express');
const {
  friendController: {
    createFriend,
    getAllFriend,
    checkFriendRequest,
    setFriendsQuery,
    updateFriend,
    getUserFriends
  },
  authController: { protect, restrictTo }
} = require('../controllers');

const router = express.Router();

router
  .route('/')
  .get(protect, setFriendsQuery, getAllFriend)
  .post(protect, checkFriendRequest, createFriend);

router.route('/:id').get(protect, getUserFriends).patch(protect, updateFriend);

module.exports = router;
