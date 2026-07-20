import mongoose from 'mongoose';

const RencanaKerjaSchema = new mongoose.Schema({
  mahasiswa_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tanggal: {
    type: String, // format YYYY-MM-DD
    required: true,
  },
  teks: {
    type: String,
    required: true,
  }
}, { timestamps: true });

// Ensure unique plan per user per day
RencanaKerjaSchema.index({ mahasiswa_id: 1, tanggal: 1 }, { unique: true });

export default mongoose.models.RencanaKerja || mongoose.model('RencanaKerja', RencanaKerjaSchema);
