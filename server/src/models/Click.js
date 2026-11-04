import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, index: true },
    ts: { type: Date, default: Date.now },
    referrer: { type: String, default: '' }, // hostname, '' = direct
    browser: { type: String, default: 'Other' },
  },
  { versionKey: false },
);

export const Click = mongoose.models.Click ?? mongoose.model('Click', clickSchema);
