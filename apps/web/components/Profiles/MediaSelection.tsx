import { useAttachments } from "../../store/attachments";
import { useStore } from "../../store/global";

function MediaSelection({ conversationId }: { conversationId: string }) {
  const setProfileTab = useStore((s) => s.setProfileTab);
  const mediaStore = useAttachments((s) => s.mediaStore);

  const media = mediaStore.get(conversationId) || {};
  const totalMedia =
    Object.values(media).reduce((p, c) => p + c.length, 0) || 0;

  return (
    <div
      onClick={() => !!totalMedia && setProfileTab("media")}
      className={`capitalize w-full flex items-center justify-between gap-4 ${!!totalMedia ? "cursor-pointer" : ""}`}
    >
      Media
      <label className="ml-auto text-base-content" htmlFor="label">
        {totalMedia}
      </label>
    </div>
  );
}

export default MediaSelection;
