import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    url: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const Link = mongoose.models.Link ?? mongoose.model('Link', linkSchema);
