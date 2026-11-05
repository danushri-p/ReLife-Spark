import mongoose from 'mongoose';

/** One assistant chat. Photos are never stored, only how many were attached. */
const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, default: '', maxlength: 4000 },
    summary: { type: String, default: '' },
    points: { type: [String], default: [] },
    caution: { type: String, default: null },
    sources: {
      type: [{ title: String, page: String, _id: false }],
      default: [],
    },
    photoCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'demo', trim: true, index: true },
    title: { type: String, default: 'New chat', trim: true, maxlength: 120 },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
