import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ticketSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'closed'],
      required: true,
      default: 'open',
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

const Ticket = model('Ticket', ticketSchema);

export default Ticket;
