import Avatar from "@features/ui/Avatar";
import { CheckedIcon } from "@features/ui/CheckedIcon";
import { IUser } from "@repo/interfaces/userInterface";

export function User({
  person,
  isSelected = false,
  selectable = true,
}: {
  person: IUser;
  isSelected?: boolean;
  selectable?: boolean;
}): React.JSX.Element {
  return (
    <div className="max-sm:px-4 px-6 flex items-center hover:bg-[--hover-secondary] gap-4 w-full h-16 py-2 cursor-pointer">
      <Avatar
        url={person.profilePicture}
        onlineIndication={false}
        profileHidden={!person.rules?.profilePicture.isVisible}
        size="40px"
      />
      <div className="h-full w-full flex justify-between items-center">
        <label className="text-sm pointer-events-none" htmlFor="">
          {person.self ? "yourself" + person.id : person.username}
        </label>
      </div>
      {selectable && isSelected ? <CheckedIcon /> : <span />}
    </div>
  );
}
