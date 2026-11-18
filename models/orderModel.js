import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 }, // Ensure valid price
      quantity: { type: Number, required: true, min: 1 } // Prevent zero or negative quantities
    }
  ],
  totalAmount: { type: Number, required: true, min: 0 }, // Ensure totalAmount is always valid
  createdAt: { type: Date, default: Date.now }
});

// Custom validation to ensure at least one item in an order
function arrayLimit(val) {
  return val.length > 0;
}

const Order = mongoose.model('Order', orderSchema);

export default Order; // ✅ ES Module Export
