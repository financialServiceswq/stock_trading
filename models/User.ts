import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  wallet: {
    balance: { type: Number, default: 10000 }, // Starting with $10,000
    currency: { type: String, default: 'USD' }
  },
  portfolio: [{
    stockSymbol: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    totalInvestment: { type: Number, required: true },
    currentValue: { type: Number, required: true }
  }],
  transactions: [{
    stockSymbol: { type: String, required: true, index: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  watchlist: [{ type: String }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.models.User || mongoose.model('User', userSchema); 