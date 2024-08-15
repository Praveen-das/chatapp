import ChatWindow from "./ChatWindow/Messenger";
import Dashboard from "./Dashboard/Dashboard";
import DisplayProfile from "./Profiles/DisplayProfile";
import Modal from "./ui/Modal";

function App() {
    return (
        <div className='flex w-full gap-4 p-4 h-screen bg-base-300 overflow-hidden'>
            <Modal />
            {/* <Navbar /> */}
            <Dashboard />
            <ChatWindow />
            <DisplayProfile />
        </div>
    )
}

export default App