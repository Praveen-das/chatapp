import { Router } from "express";
import conversationController from "../controller/conversationController";
import conversationServices from "../services/conversationServices";
import {fetchGroupsByUserId} from "../services/groupServices";
import { objectId } from "../schemas/objectId";

const router = Router();

router.get('/:userId', async(req,res)=>{
    try {
        const userId = objectId.parse(req.params.userId);
    
        const data = await Promise.all([
            conversationServices.getUserConversation(userId),
            fetchGroupsByUserId(userId)
        ])
        
        return res.json(data.flat());
    } catch (error) {
        console.log("Error in fetching user conversations", error);
        res.send(error)
    }
})

export default router;
