const { model, Schema } = require('mongoose');

const friendSchema = new Schema(
  {
    createdAt: { type: Date, default: Date.now() },

    loggedUser: {
      type: Schema.ObjectId
      // ref: 'User'
    },

    addUser: {
      type: Schema.ObjectId,
      // ref: 'User',
      required: [
        true,
        'You need to provide a user to be added. Please try again'
      ]
    },

    following: {
      type: Boolean,
      default: true
    },

    followed: {
      type: Boolean,
      default: false
    },

    friends: {
      type: String,
      default: 'pending',
      enum: ['pending', 'friends']
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

friendSchema.index({ loggedUser: 1, addUser: 1 }, { unique: true });

friendSchema.statics.follow = async function (obj) {
  const doc = await Friend.findOne({
    addUser: obj.loggedUser,
    loggedUser: obj.addUser
  });
  if (!doc && obj.following) {
    await Friend.create({
      addUser: obj.loggedUser,
      loggedUser: obj.addUser,
      following: false,
      followed: true,
      friends: 'pending'
    });
    // await Friend.calStats(doc.loggedUser._id);
    return obj;
  }
  if (!doc.following && !obj.following) {
    await Friend.deleteMany({ _id: [doc._id, obj._id] });
    await Friend.calStats(doc.loggedUser._id ?? doc.loggedUser);
    await Friend.calStats(obj.loggedUser._id ?? obj.loggedUser);
    /*or:*/
    // await doc.remove(); await obj.remove();
    return null;
  }
  doc.followed = obj.following ? true : false;
  doc.friends = obj.following && doc.following ? 'friends' : 'pending';
  await doc.save();

  obj.followed = doc.following ? true : false;
  obj.friends = obj.following && doc.following ? 'friends' : 'pending';
  return obj;
};

friendSchema.statics.calStats = async function (id) {
  const stats = await this.aggregate([
    {
      $match: { loggedUser: id }
    }
  ]).facet({
    following: [{ $match: { following: true } }],
    follower: [{ $match: { followed: true } }],
    friends: [{ $match: { friends: 'friends' } }]
  });

  const user = await model('User').findById(id);
  Object.keys(stats[0]).forEach(
    (key) => (user.stats[key] = stats[0]?.[key].length)
  );
  user.save({ validateModifiedOnly: true });
};

friendSchema.post(['save', 'remove'], function (docu, next) {
  docu.constructor.calStats(docu.loggedUser?._id ?? docu.loggedUser);
  next();
});

friendSchema.pre([/^find/], function (next) {
  this.populate({
    path: 'addUser',
    select: 'name email photo',
    model: 'User'
  });
  next();
});

const Friend = model('Friend', friendSchema);
module.exports = Friend;
