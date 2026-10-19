import mongoose from 'mongoose';

const ImpersonationTokenSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  admin_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  admin_name: { 
    type: String, 
    required: true 
  },
  admin_role: { 
    type: String, 
    required: true 
  },
  target_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['impersonate', 'revert'], 
    default: 'impersonate' 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 5 * 60 * 1000), 
    expires: 600 
  }
}, { timestamps: true });

export default mongoose.models.ImpersonationToken || mongoose.model('ImpersonationToken', ImpersonationTokenSchema);
