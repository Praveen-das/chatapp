import { useStore } from "../../../store/global";

export const NotificationBlockedAlert = () => {
    const setModal = useStore(s => s.setModal)

    return (
        <div className="modal-box relative flex flex-col gap-2 max-w-[450px] bg-base-300 ">
            <div className="flex justify-between items-center w-full ">
                <label className="font-bold text-lg" htmlFor="">Notifications disabled</label>
                <form method="dialog">
                    <button className="btn btn-circle btn-sm btn-ghost">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
            <label htmlFor="">You have denied notifications. Please enable them in your browser settings if you wish to receive notifications.</label>
        </div>
    );
};