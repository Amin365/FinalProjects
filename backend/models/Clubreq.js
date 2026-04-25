
import mongoose from "mongoose"

const  ClubreqSchema = new mongoose.Schema({
    FullName:{type:String,required:true,trim:true},
    email:{type:String,required:true,trim:true},
    phone:{type:String,required:true},
    status:{type:String,enum:["Pending","Approved","Rejected"],default:"Pending"},
    rejectionReason:{type:String,default:""},
    memberId:{type:mongoose.Schema.Types.ObjectId,ref:"Member",default:null},
    reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
    reviewedAt:{type:Date,default:null},
}

,{timestamps:true}

)

export default mongoose.model("Clubreq",ClubreqSchema);

