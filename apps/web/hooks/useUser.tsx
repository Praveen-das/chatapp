import { useStore } from "store/global";
import { useShallow } from "zustand/react/shallow";

function useUser(userId: string) {
  const user = useStore(useShallow((s) => s.users.get(userId)));
  return user;
}

export default useUser;
