import mongoose, {Schema} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //One who subscribes
        ref: 'User',
    },
    channel: {
        type: Schema.Types.ObjectId, // One who is subscribed to
        ref: 'User',
    },
},
{
    timestamps: true
})

export default mongoose.model('Subscription', subscriptionSchema);