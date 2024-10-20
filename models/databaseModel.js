// models/databaseModel.js
import mongoose from 'mongoose';

const databaseSchema = new mongoose.Schema({
    field1: { type: String, required: true },
    field2: { type: String, required: true },
}, { timestamps: true });

const DatabaseModel = mongoose.model('Database', databaseSchema);
export default DatabaseModel;
