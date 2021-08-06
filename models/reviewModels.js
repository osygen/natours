const { model, Schema } = require('mongoose');

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.statics.calAvgRatingQuantity = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const tour = await model('Tour').findById(tourId);
  tour.ratingsQuantity = stats[0]?.nRatings ?? 0;
  tour.ratingsAverage = stats[0]?.avgRating ?? 4.5;

  await tour.save({ validateModifiedOnly: true });
};

reviewSchema.pre([/^find/], function (next) {
  this.populate('user', 'name photo email');

  next();
});

reviewSchema.post(['save', 'remove'], function () {
  this.constructor.calAvgRatingQuantity(this.tour);
});

const Review = model('Review', reviewSchema);

module.exports = Review;
