import mongoose from "mongoose";

export default async function initDatabase() {
    await mongoose.connect(process.env.MONGODB_URL!)
        .then(() => console.log('db connected'))
        .catch((err) => console.log('db error---->>>', err))
}