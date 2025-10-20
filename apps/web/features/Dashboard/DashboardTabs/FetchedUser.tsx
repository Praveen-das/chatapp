import { useState } from "react";
import SecondaryHeader from "./SharedComponents/Header";
import Avatar from "@features/ui/Avatar";
import { useStore } from "store/global";
import SearchUser from "../../ui/Searchbar";
import useAxios from "@hooks/useAxios";
import { debounce } from "@lib/query";
import { IUser } from "@repo/interfaces/userInterface";
import useConversation from "@hooks/useConversation";

const setFetchedUserUser = useStore.getState().setFetchedUserUser;

function FetchedUser() {
  const fetchedUser = useStore((s) => s.fetchedUser);
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const axios = useAxios();
  const { startConversation } = useConversation();
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const users = useStore.getState().users;

  const userIsFriend = users.some((u) => u.id === fetchedUser?.id);

  const handleSearchQuery = debounce(async () => {
    setLoading(true);

    try {
      const res = await axios.get<IUser | null>(`/db/user/search?q=${searchQuery}`).then((res) => res.data);
      if (!res) return setFetchedUserUser(null);
      setFetchedUserUser(res);
    } catch (error) {
      setFetchedUserUser(null);
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, 300);

  function handleAddingUserAsAFriend() {
    startConversation(fetchedUser!);
    setDashboardTab("dashboard");
    setDeviceTab("chatarea");
  }

  return (
    <div className="flex flex-col h-full max-sm:gap-2 sm:gap-4">
      <SecondaryHeader onClose={() => setFetchedUserUser(null)} title="Find friend" mainTab="dashboard" />
      <SearchUser
        query={searchQuery}
        onClick={handleSearchQuery}
        onChange={setSearchQuery}
        initialValue={searchQuery}
      />
      <div className="flex h-full w-full flex-col items-center gap-2 pt-12 overflow-y-scroll no-scrollbar">
        {loading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : fetchedUser ? (
          <div className="flex flex-col items-center gap-4">
            <Avatar size="140px" url={fetchedUser.profilePicture} onlineIndication={false} />
            <span className="text-lg">{fetchedUser.username}</span>
            <span className="text-sm">+{fetchedUser.phoneNumber}</span>
            <div
              className="btn btn-primary text-[--black-white] px-8 mt-8"
              onClick={handleAddingUserAsAFriend}
              tabIndex={0}
            >
              {userIsFriend ? "Chat Now" : "Add to contact"}
            </div>
          </div>
        ) : (
          <span className="text-sm">User not found</span>
        )}
      </div>
    </div>
  );
}

export default FetchedUser;
