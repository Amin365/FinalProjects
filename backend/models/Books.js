import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
}, { timestamps: false });

const Counter = mongoose.model('Counter', counterSchema);

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  isbn: { type: String, required: true, unique: true },
  BookType: { type: String },

  status: { type: String, enum: ['available', 'borrowed', 'lost', 'damaged', 'archived'], default: "available" },
  book_picture:{type:String},
  totalPages: { type: Number, default: 0 },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
}, { timestamps: true });


bookSchema.pre('validate', async function () {

  if (!this.isNew || this.isbn) return;

  const prefix = 'ISBN';
  const padding = 4;
  const counterName = 'book_isbn';

  // Atomic increment to avoid race conditions
  const updated = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = (updated && updated.seq) ? updated.seq : 1;
  const padded = String(seq).padStart(padding, '0');
  this.isbn = `${prefix}${padded}`;
});

const Book = mongoose.model('Book', bookSchema);

export default Book;