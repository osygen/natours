const { Schema, model } = require('mongoose');
const slugify = require('slugify');

const tourSchema = new Schema(
  {
    name: {
      type: 'String',
      required: [true, `a tour must have a name`],
      unique: true,
      trim: true,
      maxLength: [40, 'maxlength for tour name is 40 characters'],
      minLength: [10, 'minlength for tour name is 40 characters']
    },
    slug: { type: 'String' },
    duration: {
      type: Number,
      required: [true, `a tour must have a duration`]
    },
    maxGroupSize: {
      type: Number,
      required: [true, `a tour must have a group size`]
    },
    difficulty: {
      type: 'String',
      required: [true, `a tour must have a difficulty`],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `difficulty is either: easy,medium,difficult. (🚫{VALUE})`
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'highest rating is 5.0'],
      min: [1, 'lowest rating is 1.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: 'Number',
      required: [true, `a tour must have a price`]
    },
    priceDiscount: {
      type: 'Number',
      validate: [
        function (val) {
          return val < this.price;
        },
        `discount price ({VALUE}) must be below regular price`
      ]
    },
    summary: {
      type: 'String',
      trim: true,
      required: [true, `a tour must have a summary`]
    },
    description: {
      type: 'String',
      trim: true
    },
    imageCover: {
      type: 'String',
      required: [true, `a tour must have a cover image`]
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinate: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinate: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: {
      type: [{ type: Schema.ObjectId, ref: 'User' }],
      validate: [
        function (val) {
          return val.length <= 5;
        },
        '{PATH} exceeded limit of 5'
      ]
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//VIRTUAL
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour'
});

//DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(['save'], async function (next) {
  if (this.guides.length < 1) return next();

  this.guides = await Promise.all(
    this.guides.map((id) => model('User').findOne({ _id: id, role: /guide$/ }))
  );

  this.guides = [...new Set(this.guides.map((doc) => doc?._id.toHexString()))];
  this.guides.indexOf(null) !== -1
    ? this.guides.splice(this.guides.indexOf(null), 1)
    : this.guides;

  next();
});

//QUERY MIDDLEWARE
tourSchema.pre([/^findOne/, 'deleteOne'], function (next) {
  this.find({ secretTour: { $ne: true } });

  next();
});

tourSchema.pre([/^findOne/], function (next) {
  this.populate({
    path: 'guides',
    match: { role: /guide$/i },
    select: 'name email photo role'
  });

  next();
});

//AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  // console.log(this.pipeline());
  next();
});
const Tour = model('Tour', tourSchema);

module.exports = Tour;
