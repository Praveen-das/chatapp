import React from "react";
import useAxios from "@hooks/useAxios";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { debounce } from "@lib/query";
import { useStore } from "store/global";

function SearchPrompt({query}:{query:string}) {
  const axios = useAxios();
  const setQueriedUser = useStore.getState().setFetchedUserUser;

  const handleSearchQuery = debounce(async () => {
    const res = await axios.get(`/db/user/search?q=${query}`).then((res) => res.data);
    setQueriedUser(res);
    useStore.getState().setDashboardTab("fetchedUser");
  }, 300);

  return (
    <div
      onClick={handleSearchQuery}
      className="group hover:cursor-pointer bg-base-200 outline-2 mb-8 rounded-2xl p-4 flex justify-center items-center gap-2 text-sm"
    >
      <MagnifyingGlassIcon className="size-5" />
      Search for <span className="group-hover:underline text-primary">{query}</span>
    </div>
  );
}

export default SearchPrompt;
