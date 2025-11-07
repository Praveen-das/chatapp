import { Schema, model } from "mongoose";

const dummySchema = new Schema();

const Dummy = model("dummy", dummySchema);

export default Dummy;
