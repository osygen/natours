const express = require('express');
//prettier-ignore
const {
  reviewController: {
    getAllReviews,getReview,checkReviewBody,
    createReview,deleteReview,updateReview
  },
  authController: { protect, restrictTo }
} = require('../controllers');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReviews)
  .post(protect, checkReviewBody, createReview);

router
  .route('/:id')
  .get(getReview)
  .delete(deleteReview)
  .patch(protect, checkReviewBody, updateReview);

module.exports = router;
