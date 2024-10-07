import ChatWindow from "@components/ChatWindow/Messenger";
import Dashboard from "@components/Dashboard/Dashboard";
import GroupInvitation from "@components/GroupInvitation/GroupInvitation";
import DisplayProfile from "@components/Profiles/DisplayProfile";
import Modal from "@components/ui/Modal";

export default function(){
    return(
        <div className='relative flex w-full p-4 gap-4 h-screen bg-base-300 '>
            <Modal />
            <GroupInvitation/>
            {/* <Navbar /> */}

            <Dashboard />
            <ChatWindow />
            <DisplayProfile />
        </div>
    )
};
