const express = require('express');
const reviewRouter = require('./reviewRoutes');

// prettier-ignore
const {
  tourController: {
    getAllTours,getTour,updateTour,deleteTour,
    createTour,aliasTopTours,getTourStat,
    getMonthlyPlan,checkTourBody
  },
  authController: { protect, restrictTo }
} = require('../controllers');

const router = express.Router();
//router.param('id',checkId);

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStat);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(getAllTours).post(checkTourBody, createTour);

router
  .route('/:id')
  .get(protect, getTour)
  .patch(checkTourBody, updateTour)
  .delete(protect, restrictTo('admin'), deleteTour);

module.exports = router;
